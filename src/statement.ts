import { Comments } from "./comment";

export const generateCommentStatements = (comments: Comments): string[] => {
  const commentStatements: string[] = [];

  for (const tableName in comments) {
    const { table, columns } = comments[tableName];

    const convertQuotedIdentifier = (name: string) =>
      name
        .split(".")
        .map((n) => `"${n}"`)
        .join(".");

    commentStatements.push(`-- ${tableName} comments`);
    if (table) {
      // ON TABLE
      commentStatements.push(
        `COMMENT ON TABLE ${convertQuotedIdentifier(table.tableName)} IS ${commentValue(table.comment)};`,
      );
    }

    if (columns) {
      for (const column of columns) {
        // ON COLUMN
        commentStatements.push(
          `COMMENT ON COLUMN ${convertQuotedIdentifier(`${column.tableName}.${column.columnName}`)} IS ${commentValue(column.comment)};`,
        );
      }
    }

    commentStatements.push("");
  }

  return commentStatements;
};

const commentValue = (comment?: string) => {
  if (comment) {
    const commentValue = `'${escapeComment(comment)}'`;
    return commentValue.includes("\\") ? "E" + commentValue : commentValue;
  } else {
    return "NULL";
  }
};

const escapeComment = (comment: string) => {
  return comment.replace(/'/g, "''").replace(/\n/g, "\\n");
};
