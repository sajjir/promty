"""Measure a real armed n8n test webhook; never count a timeout/error as success.
Usage: benchmark.py --url-file /private/test-webhook-url.txt --source-file /path/source.txt
No credentials, source text, URL or model response are printed or put in the public report.
"""
from pathlib import Path
import argparse,json,time,urllib.request,urllib.error,urllib.parse,os

parser=argparse.ArgumentParser()
parser.add_argument('--url-file',type=Path,required=True)
parser.add_argument('--source-file',type=Path,required=True)
parser.add_argument('--report',type=Path,default=Path(__file__).with_name('live-benchmark.json'))
args=parser.parse_args()
url=args.url_file.read_text().strip()
parts=urllib.parse.urlsplit(url)
assert parts.scheme=='https' and parts.hostname=='agent.qolamai.ir' and parts.path.startswith('/webhook-test/'),'Only owner n8n HTTPS test webhook allowed'
source=args.source_file.read_text()
req=urllib.request.Request(url,data=json.dumps({'action':'analyze_source','sourceText':source}).encode(),headers={'Content-Type':'application/json'})
started=time.monotonic();status=None;error=None;valid=False;checks=[]
try:
    with urllib.request.urlopen(req,timeout=30) as response:
        status=response.status
        raw=response.read(2*1024*1024+1)
        assert len(raw)<=2*1024*1024,'Response exceeds limit'
        result=json.loads(raw)
        required={'title','description','useCase','relatedUseCases','resourceType','intent','domains','tools','task','language','difficulty','outputFormats','tags','requiresReferenceImage','body','bodyFa','fieldsSchema','editorial'}
        assert status==200 and set(result)==required,'Not a complete valid record'
        assert all(isinstance(result[k],str) and result[k].strip() for k in ['title','body','bodyFa','description','task'])
        assert isinstance(result['fieldsSchema'],list) and isinstance(result['editorial'],dict)
        if 'cartoon' in source.lower():
            assert result['requiresReferenceImage'] is True,'Reference photo prerequisite lost'
            assert result['useCase']=='vis-09','Cartoon job classification changed; review manually'
            checks+=['reference-image prerequisite','primary cartoon use case']
        valid=True
        checks+=['HTTP 200','exact 18-key object','nonempty bilingual bodies','fields and editorial present']
except urllib.error.HTTPError as e:status=e.code;error='http_error'
except Exception as e:error=type(e).__name__
elapsed=round((time.monotonic()-started)*1000)
passed=valid and elapsed<30000
report={'realRequest':True,'elapsedMs':elapsed,'status':status,'validRecord':valid,'under30Seconds':elapsed<30000,'acceptancePassed':passed,'error':error,'checks':checks,'scope':'one real request; not p95 or semantic-quality proof'}
args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
raise SystemExit(0 if passed else 1)
