/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as Rx from 'rxjs';
import { createMockReportingCore } from '../../../../test_helpers';
import { cryptoFactory } from '../../../../server/lib/crypto';
import { executeJobFactory } from './index';
import { generatePngObservableFactory } from '../lib/generate_png';
import { LevelLogger } from '../../../../server/lib';

jest.mock('../lib/generate_png', () => ({ generatePngObservableFactory: jest.fn() }));

let mockReporting;

const cancellationToken = {
  on: jest.fn(),
};

const mockLoggerFactory = {
  get: jest.fn().mockImplementation(() => ({
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  })),
};
const getMockLogger = () => new LevelLogger(mockLoggerFactory);

const mockEncryptionKey = 'abcabcsecuresecret';
const encryptHeaders = async headers => {
  const crypto = cryptoFactory(mockEncryptionKey);
  return await crypto.encrypt(headers);
};

beforeEach(async () => {
  const kbnConfig = {
    'server.basePath': '/sbp',
  };
  const reportingConfig = {
    encryptionKey: mockEncryptionKey,
    'kibanaServer.hostname': 'localhost',
    'kibanaServer.port': 5601,
    'kibanaServer.protocol': 'http',
  };
  const mockReportingConfig = {
    get: (...keys) => reportingConfig[keys.join('.')],
    kbnConfig: { get: (...keys) => kbnConfig[keys.join('.')] },
  };

  mockReporting = await createMockReportingCore(mockReportingConfig);

  const mockElasticsearch = {
    dataClient: {
      asScoped: () => ({ callAsCurrentUser: jest.fn() }),
    },
  };
  const mockGetElasticsearch = jest.fn();
  mockGetElasticsearch.mockImplementation(() => Promise.resolve(mockElasticsearch));
  mockReporting.getElasticsearchService = mockGetElasticsearch;

  generatePngObservableFactory.mockReturnValue(jest.fn());
});

afterEach(() => generatePngObservableFactory.mockReset());

test(`passes browserTimezone to generatePng`, async () => {
  const encryptedHeaders = await encryptHeaders({});

  const generatePngObservable = generatePngObservableFactory();
  generatePngObservable.mockReturnValue(Rx.of(Buffer.from('')));

  const executeJob = await executeJobFactory(mockReporting, getMockLogger());
  const browserTimezone = 'UTC';
  await executeJob(
    'pngJobId',
    { relativeUrl: '/app/kibana#/something', browserTimezone, headers: encryptedHeaders },
    cancellationToken
  );

  expect(generatePngObservable).toBeCalledWith(
    expect.any(LevelLogger),
    'http://localhost:5601/sbp/app/kibana#/something',
    browserTimezone,
    expect.anything(),
    undefined
  );
});

test(`returns content_type of application/png`, async () => {
  const executeJob = await executeJobFactory(mockReporting, getMockLogger());
  const encryptedHeaders = await encryptHeaders({});

  const generatePngObservable = generatePngObservableFactory();
  generatePngObservable.mockReturnValue(Rx.of(Buffer.from('')));

  const { content_type: contentType } = await executeJob(
    'pngJobId',
    { relativeUrl: '/app/kibana#/something', timeRange: {}, headers: encryptedHeaders },
    cancellationToken
  );
  expect(contentType).toBe('image/png');
});

test(`returns content of generatePng getBuffer base64 encoded`, async () => {
  const testContent = 'test content';

  const generatePngObservable = generatePngObservableFactory();
  generatePngObservable.mockReturnValue(Rx.of({ buffer: Buffer.from(testContent) }));

  const executeJob = await executeJobFactory(mockReporting, getMockLogger());
  const encryptedHeaders = await encryptHeaders({});
  const { content } = await executeJob(
    'pngJobId',
    { relativeUrl: '/app/kibana#/something', timeRange: {}, headers: encryptedHeaders },
    cancellationToken
  );

  expect(content).toEqual(Buffer.from(testContent).toString('base64'));
});
