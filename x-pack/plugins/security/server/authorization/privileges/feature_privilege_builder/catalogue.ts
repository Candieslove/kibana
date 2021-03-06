/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Feature, FeatureKibanaPrivileges } from '../../../../../features/server';
import { BaseFeaturePrivilegeBuilder } from './feature_privilege_builder';

export class FeaturePrivilegeCatalogueBuilder extends BaseFeaturePrivilegeBuilder {
  public getActions(privilegeDefinition: FeatureKibanaPrivileges, feature: Feature): string[] {
    const catalogueEntries = privilegeDefinition.catalogue;

    if (!catalogueEntries) {
      return [];
    }

    return catalogueEntries.map(catalogueEntryId =>
      this.actions.ui.get('catalogue', catalogueEntryId)
    );
  }
}
