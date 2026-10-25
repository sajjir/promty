function fastOutputSchema(catalog) {
  const text={type:'string',minLength:1};
  const array=items=>({type:'array',items});
  const closed=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
  const choose=values=>({type:['string','null'],enum:[...values,null]});
  const field=closed({key:{...text,pattern:'^[a-z][a-z0-9_]*$'},label:{...text,description:'Persian user-facing label; property name is exactly label'},type:{type:'string',enum:catalog.fieldTypes},required:{type:'boolean',enum:[true]},placeholder:text,options:array(text),min:{type:'number'},max:{type:'number'}},['key','label','type','required']);
  return closed({
    title:{...text,description:'Natural Persian title'},description:{...text,description:'Persian description'},
    useCase:choose(catalog.useCases.map(r=>r[0])),relatedUseCases:{...array({type:'string',enum:catalog.useCases.map(r=>r[0])}),maxItems:2},
    resourceType:choose(catalog.resourceTypes),intent:choose(catalog.intents),
    domains:array({type:'string',enum:catalog.domains.map(r=>r[0])}),
    tools:{...array(text),maxItems:0,description:'No tool execution or compatibility has been independently verified in this draft path.'},
    task:{...text,description:'Task description in Persian'},language:choose(catalog.languages),difficulty:choose(catalog.difficulties),
    outputFormats:array({type:'string',enum:catalog.outputFormats}),tags:array(text),requiresReferenceImage:{type:'boolean'},
    body:{...text,description:'Complete source-language executable prompt. Preserve every source sentence, list item, negative, reference condition and tip. Only safe small-phrase placeholders may replace text.'},
    bodyFa:{...text,description:'Complete fluent Persian counterpart of body with every source requirement, negative, reference condition and tip; same bare placeholders.'},
    fieldsSchema:{...array(field),maxItems:4},
    editorial:closed({catalogVersion:{type:'string',enum:[catalog.version]},classificationReason:text,needsReview:{type:'boolean',enum:[true]},reviewNotes:array(text),execution:closed({requiredCapabilities:array(text),routes:{...array(text),maxItems:0}})})
  });
}
