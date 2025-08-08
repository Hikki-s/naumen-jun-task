export interface IUser {
  id: number;
  name: string;
  email: string;
  active: TActiveFilter;
}

export type TUserKey = 'id' | 'name' | 'email' | 'active';

export type TActiveFilter = 'all' | 'active' | 'inactive';
