import YAML from 'yaml';
import fs from 'fs';

var outputCSV = "field,type,description,example";
var componentsObject = YAML.parse(`...`);
var OasObject = YAML.parse(`...`);

var schemas =  componentsObject.components.schemas;
var properties = OasObject.supermodelIoLogisticsExpressCreateShipmentRequest.properties;

const extractRefName = ref => ref.split("/")[ref.split("/").length - 1]

const extractLines = (properties, level = 0) => {
    for(var fieldName in properties)
    {
        const field = properties[fieldName];
        var line = "";
        if(field["$ref"]){
            const schema = schemas[extractRefName(field["$ref"])];
            if(schema.type == "array")
                line = `${' '.repeat(level * 3)}${fieldName},array (ref),${field["$ref"]},`;
            else
                line = `${' '.repeat(level * 3)}${fieldName},object (ref),${field["$ref"]},`;
        } 
        else
        {
            line = `${' '.repeat(level * 3)}${fieldName},${field.type ?? ""},${field.description?.replaceAll(",", ";").replaceAll("<br />", " ") ?? "" }, ${field.example ?? ""}`;
        }

        if(field.type == "array" && field.items.type != "object" && !field.items["$ref"]) {
            line = `${line}\n${' '.repeat((level + 1) * 3)}items,${field.items.type ?? ""},,`;
        }
        
        outputCSV = `${outputCSV}\n${line}`;
        
        if(field.type == "object")
            extractLines(field.properties, level + 1);

        if(field["$ref"]){
            const schema = schemas[extractRefName(field["$ref"])];
            if(schema.type == "array"){
                extractLines(schema.items.properties, level + 1);
                console.log(schema);
            }
            else
                extractLines(schema.properties, level + 1);
        }
    
        if(field.type == "array" && field.items.type == "object")
        {
            extractLines(field.items.properties, level + 1);
        }

        if(field.type == "array" && !field.items.type && field.items["$ref"])
        {
            const schema = schemas[extractRefName(field.items["$ref"])];
            if(schema.type == "array")
                extractLines(schema.items.properties, level + 1);
            else
                extractLines(schema.properties, level + 1);
        }
    }
}

extractLines(properties);

fs.writeFileSync("./test.csv", outputCSV);
