/*
Finds and sets the database schema name from the model's table name.

Prisma supports multi-schema databases, but currently doens't include the schema name in the DMMT output.
As a workaround, this function parses the schema separately and matches the schema to the model name.

TODO: Remove this when @prisma/generator-helper exposes schema names in the models by default.
      See thread: https://github.com/prisma/prisma/issues/19987
*/

import {
  type BlockAttribute,
  type Model as PrismaAstModel,
  getSchema,
} from "@mrleebo/prisma-ast";
import { Model } from "./parser";

export const parseMultiSchemaModels = (
  models: Model[],
  dataModelStr: string,
): Model[] => {
  const parsedSchema = getSchema(dataModelStr);

  const multiSchemaMap = new Map(
    parsedSchema.list
      .filter((block): block is PrismaAstModel => block.type === "model")
      .map((prismaAstModel) => {
        const schemaProperty = prismaAstModel.properties.find(
          (prop): prop is BlockAttribute =>
            prop.type === "attribute" && prop.name === "schema",
        );
        const mapProperty = prismaAstModel.properties.find(
          (prop): prop is BlockAttribute =>
            prop.type === "attribute" && prop.name === "map",
        );

        const schemaName = schemaProperty?.args?.[0].value;
        const dbName = mapProperty?.args?.[0].value;
        return { schemaName, dbName };
      })
      .filter((names) => typeof names.dbName === "string")
      .map(({ schemaName, dbName }) => {
        if (typeof schemaName !== "string") {
          return [(dbName as string).replace(/"/g, ""), ""];
        }

        return [
          (dbName as string).replace(/"/g, ""),
          schemaName.replace(/"/g, ""),
        ];
      }),
  );

  return models.map((model) => {
    const schemaName = multiSchemaMap.get(model.dbName);

    if (!schemaName) {
      return model;
    }

    return { ...model, dbName: `${schemaName}.${model.dbName}` };
  });
};
