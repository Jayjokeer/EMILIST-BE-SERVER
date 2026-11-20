type JsonRecord = Record<string, unknown>;

interface OpenApiDocument extends JsonRecord {
  paths?: Record<string, Record<string, JsonRecord>>;
  components?: {
    schemas?: Record<string, JsonRecord>;
  };
}

const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
const objectId = '64e1a2b3c4d5e6f7a8b9c0d1';
const timestamp = '2026-11-20T10:30:00.000Z';

const statusMessages: Record<string, { status: string; message: string }> = {
  '400': { status: 'fail', message: 'The request contains invalid parameters or payload.' },
  '401': { status: 'fail', message: 'Authentication is required to access this resource.' },
  '403': { status: 'fail', message: 'You do not have permission to perform this action.' },
  '404': { status: 'fail', message: 'The requested resource was not found.' },
  '409': { status: 'fail', message: 'The request conflicts with the current resource state.' },
  '422': { status: 'fail', message: 'The request could not be processed.' },
  '429': { status: 'fail', message: 'Too many requests. Please try again later.' },
  '500': { status: 'error', message: 'An unexpected server error occurred.' },
  '502': { status: 'error', message: 'An upstream service returned an invalid response.' },
  '503': { status: 'error', message: 'The service is temporarily unavailable.' },
};

const titleCase = (value: string) => value
  .replace(/[{}]/g, '')
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const resourceFor = (path: string, operation: JsonRecord): string => {
  const tag = Array.isArray(operation.tags) ? String(operation.tags[0] || '') : '';
  const segment = path.split('/').filter(Boolean).reverse().find((part) => !part.startsWith('{'));
  return titleCase(segment || tag || 'resource');
};

const requestExample = (operation: JsonRecord): JsonRecord => {
  const requestBody = operation.requestBody as JsonRecord | undefined;
  const content = requestBody?.content as Record<string, JsonRecord> | undefined;
  const media = content ? Object.values(content)[0] : undefined;
  const example = media?.example;
  if (!example || typeof example !== 'object' || Array.isArray(example)) return {};

  return Object.fromEntries(Object.entries(example as JsonRecord).filter(([key]) =>
    !/(password|secret|token|otp|authorization)/i.test(key)
  ));
};

const pathParameters = (path: string): JsonRecord => Object.fromEntries(
  Array.from(path.matchAll(/\{([^}]+)\}/g), (match) => [match[1], objectId])
);

const isCollection = (path: string, operation: JsonRecord): boolean => {
  const parameters = Array.isArray(operation.parameters) ? operation.parameters as JsonRecord[] : [];
  const hasPagination = parameters.some((parameter) =>
    parameter.in === 'query' && ['page', 'limit'].includes(String(parameter.name))
  );
  return hasPagination || /(?:fetch-all|get-all|history|notifications|transactions|requests|reviews|orders|jobs|users|customers|materials|businesses|payments|reports|listings|sales|subscriptions)$/.test(path);
};

const successExample = (path: string, method: string, operation: JsonRecord): JsonRecord => {
  const resource = resourceFor(path, operation);
  const identifiers = pathParameters(path);

  if (/\/auth\/(?:login|admin-login)$/.test(path)) {
    return {
      message: 'success',
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
        user: { _id: objectId, email: 'jane@example.com', userName: 'jane', role: 'user' },
      },
    };
  }

  if (/mfa.*(?:enroll|setup)|(?:enroll|setup).*mfa/i.test(path)) {
    return {
      message: 'success',
      data: {
        secret: 'JBSWY3DPEHPK3PXP',
        otpauthUrl: 'otpauth://totp/Emilist:admin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Emilist',
        qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      },
    };
  }

  if (/upload/i.test(path)) {
    return {
      message: 'success',
      data: {
        files: [{ url: 'https://res.cloudinary.com/emilist/image/upload/example.jpg', publicId: 'uploads/example' }],
      },
    };
  }

  if (method === 'get' && isCollection(path, operation)) {
    const key = resource.toLowerCase().replace(/\s+/g, '_');
    return {
      message: 'success',
      data: {
        [key]: [{ _id: objectId, name: `Example ${resource}`, status: 'active', createdAt: timestamp, updatedAt: timestamp }],
        pagination: { currentPage: 1, pageSize: 10, totalRecords: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      },
    };
  }

  const supplied = requestExample(operation);
  return {
    message: 'success',
    data: {
      _id: objectId,
      ...identifiers,
      ...supplied,
      status: method === 'delete' ? 'deleted' : 'success',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
};

const responseMediaType = (path: string, operation: JsonRecord): string => {
  const description = `${path} ${String(operation.summary || '')}`;
  if (/\.pdf\b|\bas a pdf\b|\/pdf\b/i.test(description)) return 'application/pdf';
  if (/\bas csv\b|\breport as csv\b/i.test(description)) return 'text/csv';
  if (/download|export|statement|receipt/i.test(description)) return 'application/octet-stream';
  return 'application/json';
};

const schemaExample = (
  schema: JsonRecord,
  document: OpenApiDocument,
  seen = new Set<string>(),
): unknown => {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  if (typeof schema.$ref === 'string') {
    const ref = schema.$ref;
    if (seen.has(ref)) return {};
    seen.add(ref);
    const name = ref.split('/').pop() || '';
    const referenced = document.components?.schemas?.[name];
    return referenced ? schemaExample(referenced, document, seen) : {};
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return schemaExample(schema.oneOf[0] as JsonRecord, document, seen);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return schemaExample(schema.anyOf[0] as JsonRecord, document, seen);
  }
  if (Array.isArray(schema.allOf)) {
    return Object.assign({}, ...schema.allOf.map((part) => schemaExample(part as JsonRecord, document, new Set(seen))));
  }

  if (schema.type === 'array') {
    return [schemaExample((schema.items || {}) as JsonRecord, document, seen)];
  }
  if (schema.type === 'object' || schema.properties) {
    const properties = (schema.properties || {}) as Record<string, JsonRecord>;
    return Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, schemaExample(value, document, new Set(seen))]));
  }

  if (schema.format === 'date-time') return timestamp;
  if (schema.format === 'date') return '2026-11-20';
  if (schema.format === 'email') return 'jane@example.com';
  if (schema.format === 'uri' || schema.format === 'url') return 'https://example.com/resource';
  if (schema.format === 'binary') return '<binary file content>';
  if (schema.type === 'integer' || schema.type === 'number') return schema.minimum ?? 1;
  if (schema.type === 'boolean') return true;
  return 'string';
};

const hasExample = (media: JsonRecord): boolean => media.example !== undefined || media.examples !== undefined;

/**
 * Ensures every operation response shown in Swagger UI has a concrete sample.
 * Authored endpoint examples always win; this only fills documentation gaps.
 */
export const enrichSwaggerResponseExamples = <T extends OpenApiDocument>(document: T): T => {
  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;
      const responses = (operation.responses || {}) as Record<string, JsonRecord>;

      for (const [statusCode, response] of Object.entries(responses)) {
        if (statusCode === '204') continue;
        const numericStatus = Number(statusCode);

        if (numericStatus >= 300 && numericStatus < 400) {
          const headers = (response.headers || {}) as Record<string, JsonRecord>;
          headers.Location = { ...(headers.Location || {}), description: 'Redirect destination', schema: { type: 'string', format: 'uri' }, example: 'https://emilist.com/dashboard' };
          response.headers = headers;
          continue;
        }

        const content = (response.content || {}) as Record<string, JsonRecord>;
        if (Object.keys(content).length === 0) {
          const mediaType = numericStatus >= 200 && numericStatus < 300
            ? responseMediaType(path, operation)
            : 'application/json';
          content[mediaType] = {};
        }

        for (const [mediaType, media] of Object.entries(content)) {
          if (hasExample(media)) continue;
          if (media.schema && typeof media.schema === 'object') {
            media.example = schemaExample(media.schema as JsonRecord, document);
          } else if (!/json|\+json/i.test(mediaType)) {
            media.example = `<${mediaType} response content>`;
          } else if (numericStatus >= 200 && numericStatus < 300) {
            media.example = successExample(path, method, operation);
          } else {
            const error = statusMessages[statusCode] || { status: 'fail', message: response.description || 'The request failed.' };
            media.example = {
              code: Number.isFinite(numericStatus) ? numericStatus : 400,
              ...error,
              errors: [{ field: 'fieldName', message: 'A representative validation or request error.' }],
            };
          }
        }
        response.content = content;
      }
    }
  }
  return document;
};
