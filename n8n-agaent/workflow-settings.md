# تنظیمات و اتصالات ورک‌فلوی دریافت‌شده

منبع: `promty.json` ارسالی مالک در ۲۰۲۶-۱۰-۱۷. این snapshot مستندات است و فایل قابل import نیست. نام و شناسهٔ credentialها، مسیر وب‌هوک، شناسه‌های داخلی و metadata محیط آرشیو نشده‌اند. credential واقعی مدل بررسی یا آزمایش نشده است.

فیلد `active` در فایل منبع true است؛ این پرچم export، وضعیت زندهٔ n8n را اثبات نمی‌کند. pinData خالی است؛ دادهٔ اجرای واقعی در فایل وجود ندارد. تصویر ارسالی اجرای شاخهٔ Design را نشان می‌دهد و محتوای خروجی یا موفقیت هر سه شاخه را اثبات نمی‌کند.

SHA-256 منبع: `541b791ba12eac85d86eb89890ad3e82170d770d2fe070eb2671193cd7143909`.

## نودهای پشتیبان

``````json
[
  {
    "name": "Google Gemini Chat Model2",
    "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    "typeVersion": 1.1,
    "parameters": {
      "modelName": "models/gemini-3.1-flash-lite-preview",
      "options": {}
    }
  },
  {
    "name": "Code in JavaScript1",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "parameters": {
      "jsCode": "// ۱. دریافت خروجی از ایجنت (نود قبلی)\nconst agentData = $input.first().json;\n\nlet finalResult = {};\n\ntry {\n    // پیدا کردن متن خروجی (در فیلد output)\n    let rawText = agentData.output || agentData.text || \"\";\n\n    if (typeof rawText === 'string') {\n        // جادوی اصلی: پاک کردن کلمه‌های مزاحم ```json و ``` از ابتدا و انتهای متن\n        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();\n        \n        // تبدیل متن تمیز شده به آبجکت استاندارد\n        finalResult = JSON.parse(rawText);\n    } else {\n        // اگر سیستم از قبل آن را آبجکت کرده بود\n        finalResult = rawText;\n    }\n} catch (error) {\n    throw new Error(\"خطا در پردازش خروجی ایجنت. فرمت JSON نامعتبر است.\");\n}\n\n// ۲. اطمینان از وجود فیلدهای حیاتی برای سایت (Fallback)\nif (!finalResult.title) finalResult.title = \"پرامپت بدون عنوان\";\nif (!finalResult.tags) finalResult.tags = [];\n\n// پاک‌سازی فیلدهای احتمالی مسیریابی (جهت تمیز ماندن دیتابیس سایت)\ndelete finalResult.routing_category;\ndelete finalResult.content_type;\ndelete finalResult.source_language;\ndelete finalResult.routing_confidence;\ndelete finalResult.routing_note;\n\n// ۳. ارسال دیتای نهاییِ خالص به سایت\nreturn { json: finalResult };"
    }
  },
  {
    "name": "Respond to Webhook2",
    "type": "n8n-nodes-base.respondToWebhook",
    "typeVersion": 1.5,
    "parameters": {
      "respondWith": "json",
      "responseBody": "={{ $json }}",
      "options": {}
    }
  },
  {
    "name": "Webhook",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 2.1,
    "parameters": {
      "httpMethod": "POST",
      "path": "[REDACTED_WEBHOOK_PATH]",
      "responseMode": "responseNode",
      "options": {}
    }
  },
  {
    "name": "RouterOutputParser",
    "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
    "typeVersion": 1.3,
    "parameters": {
      "jsonSchemaExample": "{\n  \"routing_category\": \"design\",\n  \"content_type\": \"image_generation\",\n  \"source_language\": \"english\",\n  \"routing_confidence\": 0.99,\n  \"routing_note\": \"این پرامپت برای تولید تصویر طراحی شده است.\"\n}"
    }
  },
  {
    "name": "RouteSwitch",
    "type": "n8n-nodes-base.switch",
    "typeVersion": 3.4,
    "parameters": {
      "rules": {
        "values": [
          {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 3
              },
              "conditions": [
                {
                  "leftValue": "={{ $json.output.routing_category }}",
                  "rightValue": "=design",
                  "operator": {
                    "type": "string",
                    "operation": "equals"
                  }
                }
              ],
              "combinator": "and"
            },
            "renameOutput": true,
            "outputKey": "design-video-image"
          },
          {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 3
              },
              "conditions": [
                {
                  "leftValue": "={{ $json.output.routing_category }}",
                  "rightValue": "=programming",
                  "operator": {
                    "type": "string",
                    "operation": "contains"
                  }
                }
              ],
              "combinator": "and"
            },
            "renameOutput": true,
            "outputKey": "cod"
          },
          {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 3
              },
              "conditions": [
                {
                  "leftValue": "={{ JSON.parse($json.output).routing_category }}",
                  "rightValue": "general",
                  "operator": {
                    "type": "string",
                    "operation": "equals",
                    "name": "filter.operator.equals"
                  }
                }
              ],
              "combinator": "and"
            },
            "renameOutput": true,
            "outputKey": "general"
          }
        ]
      },
      "options": {}
    }
  }
]
``````

## اتصالات کامل بر اساس نام نودها

``````json
{
  "Google Gemini Chat Model2": {
    "ai_languageModel": [
      [
        {
          "node": "Design",
          "type": "ai_languageModel",
          "index": 0
        },
        {
          "node": "programming",
          "type": "ai_languageModel",
          "index": 0
        },
        {
          "node": "general",
          "type": "ai_languageModel",
          "index": 0
        },
        {
          "node": "QA/Verifier",
          "type": "ai_languageModel",
          "index": 0
        },
        {
          "node": "RouterNode",
          "type": "ai_languageModel",
          "index": 0
        }
      ]
    ]
  },
  "Code in JavaScript1": {
    "main": [
      [
        {
          "node": "Respond to Webhook2",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "programming": {
    "main": [
      [
        {
          "node": "QA/Verifier",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Webhook": {
    "main": [
      [
        {
          "node": "RouterNode",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "RouterNode": {
    "main": [
      [
        {
          "node": "RouteSwitch",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "RouterOutputParser": {
    "ai_outputParser": [
      [
        {
          "node": "RouterNode",
          "type": "ai_outputParser",
          "index": 0
        }
      ]
    ]
  },
  "RouteSwitch": {
    "main": [
      [
        {
          "node": "Design",
          "type": "main",
          "index": 0
        }
      ],
      [
        {
          "node": "programming",
          "type": "main",
          "index": 0
        }
      ],
      [
        {
          "node": "general",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "general": {
    "main": [
      [
        {
          "node": "QA/Verifier",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Design": {
    "main": [
      [
        {
          "node": "QA/Verifier",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "QA/Verifier": {
    "main": [
      [
        {
          "node": "Code in JavaScript1",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Respond to Webhook2": {
    "main": [
      []
    ]
  }
}
``````

## تنظیمات سطح ورک‌فلو

``````json
{
  "executionOrder": "v1",
  "binaryMode": "separate",
  "availableInMCP": false
}
``````
