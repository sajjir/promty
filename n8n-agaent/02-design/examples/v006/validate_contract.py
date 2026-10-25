"""Local contract fixtures, NOT an LLM, n8n, or creative-model evaluation."""
from pathlib import Path
from collections import Counter
from copy import deepcopy
from datetime import date
from itertools import product
import json, re, math

ROOT={'title','description','useCase','relatedUseCases','resourceType','intent','domains','tools','task','language','difficulty','outputFormats','tags','requiresReferenceImage','body','bodyFa','fieldsSchema','editorial'}
TYPES={'text','textarea','color','select','radio','switch','slider','multiselect','url'}

def require(ok, message):
 if not ok: raise ValueError(message)

def strings(value):
 return isinstance(value,list) and all(isinstance(x,str) and x.strip() for x in value) and len(set(value))==len(value)

def placeholders(text):
 prose=re.sub(r'(?ms)^\s*(`{3,}|~{3,})[^\n]*\n.*?^\s*\1\s*$', '', text)
 return Counter(re.findall(r'\[\[([a-z][a-z0-9_]*)\]\]',prose))

def validate(obj, catalog, allowed, evidence=()):
 require(isinstance(obj,dict) and set(obj)==ROOT,'root properties')
 for key in ['title','description','task','body','bodyFa']:
  require(isinstance(obj[key],str) and bool(obj[key].strip()),key)
 ed=obj['editorial']
 require(isinstance(ed,dict) and set(ed)=={'catalogVersion','classificationReason','needsReview','reviewNotes','execution'},'editorial properties')
 require(type(ed['needsReview']) is bool,'needsReview type')
 require(isinstance(ed['classificationReason'],str) and bool(ed['classificationReason'].strip()),'classification reason')
 require(isinstance(ed['reviewNotes'],list) and all(isinstance(x,str) and x.strip() for x in ed['reviewNotes']),'review notes')
 require(ed['catalogVersion']==catalog['version'],'catalog version')
 slugs={x['slug'] for x in catalog['useCases']}
 primary=obj['useCase']; related=obj['relatedUseCases']
 require(primary is None or primary in slugs,'primary membership')
 require(strings(related) and len(related)<=2 and all(x in slugs and x!=primary for x in related),'related uses')
 require(primary is not None or (ed['needsReview'] and not related and ed['reviewNotes']),'missing primary needs review')
 require(obj['resourceType'] in {'prompt','skill','agent-guide'},'resource type')
 require(obj['resourceType'] in catalog['resourceTypes'] or (obj['resourceType']=='prompt' and ed['needsReview'] and ed['reviewNotes']),'resource catalog')
 for key in ['domains','tools','outputFormats','tags']:
  require(strings(obj[key]),key+' array')
 tax={'intent':'intents','language':'languages','difficulty':'difficulties','domains':'domains','tools':'tools','outputFormats':'outputFormats'}
 for key,listkey in tax.items():
  supplied=allowed.get(listkey,[])
  values=[x.strip() for x in supplied.split(',') if x.strip()] if isinstance(supplied,str) else supplied
  actual=obj[key]
  if actual is None:
   require(key in {'intent','language','difficulty'} and ed['needsReview'] and ed['reviewNotes'],'null taxonomy')
  else:
   require(all(x in values for x in (actual if isinstance(actual,list) else [actual])),'taxonomy membership '+key)
 require(bool(obj['outputFormats']) or (ed['needsReview'] and ed['reviewNotes']),'missing output needs review')
 require(type(obj['requiresReferenceImage']) is bool,'reference image type')
 fields=obj['fieldsSchema']; require(isinstance(fields,list),'fields array')
 keys=[]
 for field in fields:
  require(isinstance(field,dict) and {'key','label','type','required'}<=set(field)<= {'key','label','type','required','placeholder','options','min','max'},'field properties')
  require(isinstance(field['key'],str) and re.fullmatch('[a-z][a-z0-9_]*',field['key']),'field key')
  require(isinstance(field['label'],str) and bool(field['label'].strip()),'field label')
  require(field['type'] in TYPES and field['required'] is True,'field type/required')
  keys.append(field['key'])
  if field['type'] in {'select','radio','multiselect'}:
   require(strings(field.get('options')) and bool(field['options']),'options')
   parts=[x.split('|') for x in field['options']]
   require(all(1<=len(p)<=2 and all(x.strip() for x in p) for p in parts),'bilingual option shape')
   require(len({p[0].strip() for p in parts})==len(parts),'duplicate insertion values')
  for prop in ['min','max']:
   if prop in field: require(type(field[prop]) in {int,float} and math.isfinite(field[prop]),'numeric bounds')
  if field['type']=='slider': require('min' in field and 'max' in field and field['min']<field['max'],'slider range')
 require(len(set(keys))==len(keys),'duplicate fields')
 en=placeholders(obj['body']); fa=placeholders(obj['bodyFa'])
 require(set(en)==set(keys),'body/schema parity')
 require(en==fa,'language token parity')
 ex=ed['execution']; require(isinstance(ex,dict) and set(ex)=={'requiredCapabilities','routes'},'execution properties')
 require(strings(ex['requiredCapabilities']) and isinstance(ex['routes'],list),'execution types')
 for route in ex['routes']:
  require(set(route)=={'environment','model','status','testedAt','evidenceRefs','requirements','steps'},'route properties')
  require(isinstance(route['environment'],str) and bool(route['environment'].strip()),'environment')
  require(route['model'] is None or isinstance(route['model'],str),'model')
  require(route['status'] in {'suggested','tested'},'route status')
  require(strings(route['evidenceRefs']) and strings(route['requirements']) and strings(route['steps']),'route lists')
  if route['status']=='suggested':
   require(route['testedAt'] is None and route['evidenceRefs']==[],'suggested evidence')
  else:
   require(isinstance(route['testedAt'],str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}',route['testedAt']),'tested date')
   date.fromisoformat(route['testedAt'])
   require(bool(route['evidenceRefs']),'tested refs')
   for ref in route['evidenceRefs']:
    matches=[x for x in evidence if x.get('id')==ref and x.get('status')=='passed' and x.get('environment')==route['environment'] and x.get('model')==route['model'] and x.get('testedAt')==route['testedAt'] and isinstance(x.get('result'),str) and x['result'].strip()]
    require(bool(matches),'unsupported tested claim')
 return True

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser(); parser.add_argument('--bundle',type=Path,default=Path(__file__).parent); args=parser.parse_args(); root=args.bundle
 ref=json.loads((root/'reference-output.json').read_text()); request=json.loads((root/'test-input.json').read_text()); catalog=request['classificationCatalog']; allowed=request['allowedTaxonomies']
 results=[]
 def case(name, change=lambda x:None, accepted=False, custom_catalog=None, custom_allowed=None, evidence=()):
  obj=deepcopy(ref); change(obj)
  try:
   validate(obj,custom_catalog or catalog,custom_allowed or allowed,evidence); actual=True; reason=None
  except ValueError as error: actual=False; reason=str(error)
  require(actual==accepted,'unexpected fixture outcome: '+name+' '+str(reason))
  results.append({'name':name,'expected':'accept' if accepted else 'reject','observed':'accept' if actual else 'reject','reason':reason})
 case('complete manually authored reference',accepted=True)
 case('unknown primary',lambda x:x.update(useCase='made-up'))
 case('unknown related',lambda x:x.update(relatedUseCases=['made-up']))
 case('primary repeated as related',lambda x:x.update(relatedUseCases=['vis-09']))
 case('duplicate related',lambda x:x.update(relatedUseCases=['vis-04','vis-04']))
 case('more than two related',lambda x:x.update(relatedUseCases=['vis-04','vis-03','vis-02']))
 case('unrelated parent-group identifier',lambda x:x.update(useCase='visual'))
 case('unknown resource type',lambda x:x.update(resourceType='markdown'))
 case('missing primary without review',lambda x:x.update(useCase=None,relatedUseCases=[]))
 def unresolved(x):
  x.update(useCase=None,relatedUseCases=[]); x['editorial'].update(needsReview=True,reviewNotes=['کاربرد مناسب در فهرست پیدا نشد.'])
 case('explicit unresolved classification',unresolved,accepted=True)
 empty=deepcopy(catalog); empty['useCases']=[]
 case('explicit empty catalog forbids fallback category',custom_catalog=empty)
 case('empty catalog with unresolved review',unresolved,accepted=True,custom_catalog=empty)
 case('unused field',lambda x:x['fieldsSchema'].append({'key':'unused','label':'بی‌استفاده','type':'text','required':True}))
 case('duplicate field',lambda x:x['fieldsSchema'].append(deepcopy(x['fieldsSchema'][0])))
 case('Persian token dropped',lambda x:x.update(bodyFa=x['bodyFa'].replace('[[line_weight]]','خطوط')))
 case('different occurrence counts',lambda x:x.update(bodyFa=x['bodyFa']+' [[line_weight]]'))
 case('unsupported field property',lambda x:x['fieldsSchema'][0].update(optionsFa=[]))
 case('empty option label',lambda x:x['fieldsSchema'][0]['options'].append('value|'))
 case('duplicate option insertion',lambda x:x['fieldsSchema'][0]['options'].append(x['fieldsSchema'][0]['options'][0].split('|')[0]+'|عنوان دیگر'))
 case('required false',lambda x:x['fieldsSchema'][0].update(required=False))
 case('unapproved tool',lambda x:x.update(tools=['unknown-tool']))
 case('unknown root property',lambda x:x.update(industry='example'))
 strings_allowed={k:','.join(v) for k,v in allowed.items()}
 case('comma-separated taxonomy lists',accepted=True,custom_allowed=strings_allowed)
 suggested={'environment':'Example reference-image editor','model':None,'status':'suggested','testedAt':None,'evidenceRefs':[],'requirements':['دسترسی به ویرایشگر عکس مرجع'],'steps':['عکس را بارگذاری و دستور را وارد کنید.']}
 def route(x,r): x['editorial']['execution']['routes']=[deepcopy(r)]
 case('suggested route shape',lambda x:route(x,suggested),accepted=True)
 forged={**suggested,'status':'tested','testedAt':'2026-10-18','evidenceRefs':['fixture-evidence']}
 case('candidate cannot invent a tested result',lambda x:route(x,forged))
 evidence=[{'id':'fixture-evidence','environment':forged['environment'],'model':None,'testedAt':'2026-10-18','status':'passed','result':'Synthetic fixture only; no model execution.'}]
 case('matching synthetic supplied evidence',lambda x:route(x,forged),accepted=True,evidence=evidence)
 wrong=deepcopy(evidence); wrong[0]['environment']='Different environment'
 case('mismatched evidence environment',lambda x:route(x,forged),evidence=wrong)
 case('suggested route cannot carry a tested date',lambda x:route(x,{**suggested,'testedAt':'2026-10-18'}))
 case('boolean reference flag required',lambda x:x.update(requiresReferenceImage='true'))
 # Render all curated combinations exactly as the current detail page handles matched nonnumeric options.
 rendered=[]
 for indices in product(*[range(len(f['options'])) for f in ref['fieldsSchema']]):
  versions={}
  for lang,template in [('en',ref['body']),('fa',ref['bodyFa'])]:
   final=template
   for field,index in zip(ref['fieldsSchema'],indices):
    parts=field['options'][index].split('|'); value=parts[0] if lang=='en' else parts[1]
    final=final.replace('[['+field['key']+']]',value)
   require(not placeholders(final),'unresolved rendered tokens')
   require('با ضخامت خط دستی' not in final,'known broken phrase')
   versions[lang]=final
  rendered.append({'indices':indices,**versions})
 (root/'rendered-combinations.json').write_text(json.dumps(rendered,ensure_ascii=False,indent=2)+'\n')
 report={'kind':'local structural/reference checks, not model runs','fixtures':results,'passed':len(results),'renderedCombinations':len(rendered),'renderedLanguageVariants':len(rendered)*2,'limits':['Reference output is manually authored.','Grammar and semantic intent require editorial review; assertions cover only known defects.','No n8n, LLM, image model, or live publication was executed.','Application import, persistence, SEO, and the legacy Code node were not upgraded.']}
 (root/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'fixturesPassed':len(results),'combinations':len(rendered),'languageVariants':len(rendered)*2}))
