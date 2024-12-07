import { ZodError } from 'zod';

const issueSeparator = '; ';
const unionSeparator = ', or ';

export function fromZodError(zodError: ZodError): string {
  const reason: string = zodError.errors
    .map((issue) =>
      getMessageFromZodIssue({
        issue,
        issueSeparator,
        unionSeparator
      })
    )
    .join(issueSeparator);

  return reason;
}

function getMessageFromZodIssue({
  issue,
  issueSeparator,
  unionSeparator
}: {
  issue: ZodError['errors'][number];
  issueSeparator: string;
  unionSeparator: string;
}): string {
  if (issue.code === 'invalid_union') {
    return (issue.unionErrors || [])
      .reduce<Array<string>>((acc: Array<string>, zodError: ZodError) => {
        const newIssues: string = (zodError.issues || [])
          .map((issue) =>
            getMessageFromZodIssue({
              issue,
              issueSeparator,
              unionSeparator
            })
          )
          .join(issueSeparator);

        if (!acc.includes(newIssues)) {
          acc.push(newIssues);
        }

        return acc;
      }, [])
      .join(unionSeparator);
  }

  const pathLength: number = issue.path.length;

  if (pathLength !== 0) {
    // handle array indices
    if (pathLength === 1) {
      const [identifier]: Array<string | number> = issue.path;

      if (typeof identifier === 'number') {
        return `${issue.message} at index ${identifier}`;
      }
    }

    if (issue.message === 'Required') {
      return `'${joinPath(issue.path)}' property is required`;
    }

    return `${issue.message} at '${joinPath(issue.path)}'`;
  }

  return issue.message;
}

export function joinPath(path: Array<string | number>): string {
  if (path.length === 1) {
    return path[0]?.toString() ?? '';
  }

  const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  return path.reduce<string>((acc: string, item: string | number) => {
    // handle numeric indices
    if (typeof item === 'number') {
      return `${acc}[${item}]`;
    }

    // handle quoted values
    if (typeof item === 'string' && item.includes('"')) {
      return `${acc}["${escapeQuotes(item as string)}"]`;
    }

    // handle special characters
    if (typeof item === 'string' && !identifierRegex.test(item)) {
      return `${acc}["${item}"]`;
    }

    // handle normal values
    const separator: string = acc.length === 0 ? '' : '.';
    return acc + separator + item;
  }, '');
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}
