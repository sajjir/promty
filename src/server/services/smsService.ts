import crypto from "crypto";

export interface SendOtpResult {
  success: boolean;
  recId?: string;
  message?: string;
  cooldownSeconds?: number;
}

export interface CachedOtp {
  phone: string;
  codeHash: string;
  expiresAt: number;
  lastSentAt: number;
}

/**
 * Sanitizes raw mobile input into strict 11-digit Iranian mobile format: 09xxxxxxxxx
 * - Converts Persian and Arabic digits to English digits (۰-۹ and ٠-٩ -> 0-9)
 * - Strips whitespace, dashes, parentheses, and prefixes (+98, 0098, 98)
 * - Validates standard format /^09\d{9}$/
 * - Throws an explicit error if format is invalid
 */
export function sanitizeIranianMobile(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw new Error("شماره موبایل وارد نشده است.");
  }

  // 1. Convert Persian and Arabic digits to English digits (۰-۹ -> 0-9)
  let cleaned = rawPhone
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

  // 2. Strip spaces, dashes, parentheses, dots, and other non-digits except leading plus
  cleaned = cleaned.replace(/[\s\-_().]/g, "").replace(/[^\d+]/g, "");

  // 3. Strip country code prefixes (+98, 0098, 98)
  if (cleaned.startsWith("+98")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("0098")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("98") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }

  // 4. Ensure final output strictly matches /^09\d{9}$/
  const iranMobileRegex = /^09\d{9}$/;
  if (!iranMobileRegex.test(cleaned)) {
    throw new Error("فرمت شماره موبایل نامعتبر است. شماره باید ۱۱ رقمی استاندارد و با ۰۹ آغاز شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).");
  }

  return cleaned;
}

class SmsService {
  private endpoint = "http://api.payamak-panel.com/post/send.asmx";
  // 120 seconds TTL and rate limit window (2 minutes)
  private cooldownSeconds = 120;
  private otpTtlMs = 120 * 1000;

  // In-memory cache for fast lookups and rate-limiting
  private otpCache = new Map<string, CachedOtp>();

  /**
   * Sanitizes and validates an Iranian mobile number into 11-digit format: 09xxxxxxxxx
   */
  public sanitizePhoneNumber(rawPhone: string): string {
    return sanitizeIranianMobile(rawPhone);
  }

  /**
   * Generates a secure 5-digit OTP code
   */
  public generateOtpCode(): string {
    const num = crypto.randomInt(10000, 99999);
    return num.toString();
  }

  /**
   * Hashes the OTP code using SHA-256
   */
  public hashCode(code: string): string {
    return crypto.createHash("sha256").update(code.trim()).digest("hex");
  }

  /**
   * Checks if an OTP can be sent to this phone or if rate-limit is active
   */
  public checkRateLimit(phone: string): { allowed: boolean; remainingSeconds: number } {
    const cached = this.otpCache.get(phone);
    if (!cached) {
      return { allowed: true, remainingSeconds: 0 };
    }

    const elapsed = Date.now() - cached.lastSentAt;
    const cooldownMs = this.cooldownSeconds * 1000;
    if (elapsed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { allowed: false, remainingSeconds };
    }

    return { allowed: true, remainingSeconds: 0 };
  }

  /**
   * Formats error codes returned by MeliPayamak SendByBaseNumber
   */
  public getMeliPayamakErrorMessage(code: string): string {
    const map: Record<string, string> = {
      "0": "نام کاربری یا کلمه عبور ملی‌پیامک اشتباه است (کد ۰).",
      "-1": "دسترسی وب‌سرویس نامعتبر است یا نام کاربری/رمز عبور اشتباه است (کد -۱).",
      "-2": "اعتبار پنل پیامکی کافی نیست (کد -۲).",
      "-3": "شماره گیرنده در لیست سیاه (Blacklist) مخابرات است (کد -۳).",
      "-4": "شماره گیرنده نامعتبر است (کد -۴).",
      "-5": "کد متن (bodyId) متناظر با الگو یافت نشد یا تایید نشده است (کد -۵).",
      "-6": "شماره گیرنده نامعتبر است یا خطا در سامانه پیامکی رخ داده است (کد -۶).",
      "-7": "متن یا متغیر ارسالی خالی است یا ساختار متغیرها با الگو مطابقت ندارد (کد -۷).",
      "-8": "خط ارسال‌کننده تعریف نشده است (کد -۸).",
      "-9": "دسترسی وب‌سرویس موقتاً مسدود است (کد -۹).",
      "-10": "ترافیک وب‌سرویس بیش از حد مجاز است (کد -۱۰).",
      "-11": "قالب الگو حاوی کلمات مسدود است (کد -۱۱).",
    };
    return map[code] || `خطای نامشخص در سامانه پیامکی ملی‌پیامک (کد خطا یا شناسه نامعتبر: ${code})`;
  }

  /**
   * Sends an OTP code to a mobile number via MeliPayamak SendByBaseNumber SOAP service
   */
  public async sendOtp(rawPhone: string, code: string): Promise<SendOtpResult> {
    const phone = this.sanitizePhoneNumber(rawPhone);

    // Rate-limiting check (120 seconds cooldown)
    const rateCheck = this.checkRateLimit(phone);
    if (!rateCheck.allowed) {
      throw new Error(`لطفاً قبل از درخواست مجدد، ${rateCheck.remainingSeconds} ثانیه صبر کنید.`);
    }

    const username = process.env.MELIPAYAMAK_USERNAME;
    const password = process.env.MELIPAYAMAK_PASSWORD;
    const bodyIdStr = process.env.MELIPAYAMAK_OTP_BODY_ID;

    let recId: string;

    // If credentials are provided, invoke the real MeliPayamak SOAP service
    if (username && password && bodyIdStr) {
      const bodyId = Number(bodyIdStr);
      if (isNaN(bodyId)) {
        throw new Error("شناسه الگوی پیامک (MELIPAYAMAK_OTP_BODY_ID) نامعتبر است.");
      }

      // Strictly pass text as an array of strings: [String(code)]
      recId = await this.invokeSendByBaseNumber({
        username,
        password,
        to: phone,
        bodyId,
        text: [String(code)],
      });
    } else {
      // In development or when credentials are not yet configured:
      // Produce a numeric string > 15 digits and log to console
      recId = "20261004" + Date.now().toString() + "000";
      console.log(`\n========================================`);
      console.log(`[SMS Service DEV] OTP Code for ${phone}: ${code}`);
      console.log(`[SMS Service DEV] Mock recId (>15 digits): ${recId}`);
      console.log(`========================================\n`);
    }

    // Save into cache
    const now = Date.now();
    this.otpCache.set(phone, {
      phone,
      codeHash: this.hashCode(code),
      expiresAt: now + this.otpTtlMs,
      lastSentAt: now,
    });

    return {
      success: true,
      recId,
      cooldownSeconds: this.cooldownSeconds,
      message: "کد تایید با موفقیت ارسال شد.",
    };
  }

  /**
   * Invokes MeliPayamak's SendByBaseNumber via SOAP envelope
   * Expects text to strictly be an array of strings: string[]
   */
  public async invokeSendByBaseNumber(params: {
    username: string;
    password: string;
    to: string;
    bodyId: number;
    text: string[];
  }): Promise<string> {
    // Strictly validate that text is an array of strings
    if (!Array.isArray(params.text)) {
      throw new Error("پارامتر text باید منحصراً به صورت آرایه‌ای از رشته‌ها (Array of strings) ارسال شود.");
    }

    // Render ArrayOfString in XML schema
    const textXmlItems = params.text
      .map((item) => `<string>${this.escapeXml(String(item))}</string>`)
      .join("");

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SendByBaseNumber xmlns="http://tempuri.org/">
      <username>${this.escapeXml(params.username)}</username>
      <password>${this.escapeXml(params.password)}</password>
      <text>${textXmlItems}</text>
      <to>${this.escapeXml(params.to)}</to>
      <bodyId>${params.bodyId}</bodyId>
    </SendByBaseNumber>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://tempuri.org/SendByBaseNumber",
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`خطای ارتباط با سامانه پیامکی (${response.status} ${response.statusText})`);
    }

    const xmlResponse = await response.text();
    const match = xmlResponse.match(/<SendByBaseNumberResult>(.*?)<\/SendByBaseNumberResult>/);
    if (!match || !match[1]) {
      throw new Error("پاسخ وب‌سرویس ملی‌پیامک نامعتبر است یا تگ SendByBaseNumberResult یافت نشد.");
    }

    const rawResult = match[1].trim();

    // Check if result is a negative number or non-positive value
    const numVal = Number(rawResult);
    if (!isNaN(numVal) && numVal <= 0) {
      throw new Error(this.getMeliPayamakErrorMessage(rawResult));
    }

    // A numeric string > 15 digits indicates success (recId)
    if (/^\d+$/.test(rawResult) && rawResult.length > 15) {
      return rawResult;
    }

    // If it starts with a dash or is a small number (error code), throw explicit error
    if (rawResult.startsWith("-") || (!isNaN(numVal) && numVal < 1000)) {
      throw new Error(this.getMeliPayamakErrorMessage(rawResult));
    }

    // Any other invalid return value
    throw new Error(this.getMeliPayamakErrorMessage(rawResult));
  }

  /**
   * Verifies an OTP code for a phone number
   */
  public verifyOtp(rawPhone: string, code: string): boolean {
    const phone = this.sanitizePhoneNumber(rawPhone);
    const cached = this.otpCache.get(phone);

    if (!cached) {
      return false;
    }

    if (Date.now() > cached.expiresAt) {
      this.otpCache.delete(phone);
      return false;
    }

    const incomingHash = this.hashCode(code);
    if (incomingHash !== cached.codeHash) {
      return false;
    }

    // Code verified successfully, clear from cache to prevent replay
    this.otpCache.delete(phone);
    return true;
  }

  /**
   * Escapes XML characters to prevent injection
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  }
}

export const smsService = new SmsService();
