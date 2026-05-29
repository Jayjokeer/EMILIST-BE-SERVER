import { NotFoundError } from "../errors/error";
import {  SetupServiceDto, UserProfileDto } from "../interfaces/business.interface";

export const PROFILE_FIELDS: (keyof UserProfileDto)[] = [
  'firstName',
  'lastName',
  'mobile',
  'language',
  'houseAddress',
  'city',
  'state',
  'country',
  'bio',
];
 

export function assertAllProfileFieldsPresent(dto: UserProfileDto): void {
  const missing = PROFILE_FIELDS.filter((f) => !dto[f]?.toString().trim());
  if (missing.length) {
    throw new NotFoundError(
      `The following fields are required: ${missing.join(', ')}`
    );
  }
}

const SETUP_SERVICE_FIELDS: (keyof SetupServiceDto)[] = [
  'services',
  'coverageArea',
  'businessName',
  'yearFounded',
  'numberOfEmployee',
  'businessAddress',
  'businessState',
  'businessCountry',
  'startingPrice',
  'currency',
  'rateUnit',
  'noticePeriod',
  'businessDescription',
];
 
export const assertServiceFieldsPresent = (dto: SetupServiceDto): void => {
  const missing = SETUP_SERVICE_FIELDS.filter((f) => {
    const val = dto[f];
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'number') return val === undefined || val === null;
    return !val?.toString().trim();
  });
  if (missing.length) {
    throw new Error(`The following fields are required: ${missing.join(', ')}`);
  }
  if (dto.coverageArea.length > 5) {
    throw new Error('Coverage area cannot exceed 5 locations');
  }
  if (dto.businessImages && dto.businessImages.length > 5) {
    throw new Error('You can upload a maximum of 5 business images');
  }
};