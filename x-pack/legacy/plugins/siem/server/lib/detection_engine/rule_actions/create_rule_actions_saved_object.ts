/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { RuleAlertAction } from '../../../../common/detection_engine/types';
import { AlertServices } from '../../../../../../../plugins/alerting/server';
import { ruleActionsSavedObjectType } from './saved_object_mappings';
import { IRuleActionsAttributesSavedObjectAttributes } from './types';
import { getThrottleOptions, getRuleActionsFromSavedObject } from './utils';

interface CreateRuleActionsSavedObject {
  ruleAlertId: string;
  savedObjectsClient: AlertServices['savedObjectsClient'];
  actions: RuleAlertAction[] | undefined;
  throttle: string | null | undefined;
}

export const createRuleActionsSavedObject = async ({
  ruleAlertId,
  savedObjectsClient,
  actions = [],
  throttle,
}: CreateRuleActionsSavedObject): Promise<{
  id: string;
  actions: RuleAlertAction[];
  alertThrottle: string | null;
  ruleThrottle: string;
}> => {
  const ruleActionsSavedObject = await savedObjectsClient.create<
    IRuleActionsAttributesSavedObjectAttributes
  >(ruleActionsSavedObjectType, {
    ruleAlertId,
    actions,
    ...getThrottleOptions(throttle),
  });

  return getRuleActionsFromSavedObject(ruleActionsSavedObject);
};
