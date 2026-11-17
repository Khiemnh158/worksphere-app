import type { WorkplaceContext } from '../../src/features/workspace/api';
export const workplaceFixture: WorkplaceContext = {
  admin: false,
  executive: false,
  capabilities: [],
  user: {
    id: 'me',
    full_name: 'Hải',
    username: 'hai.it',
    email: 'hai@local.example',
    department_id: 'it',
    department_name: 'Công nghệ thông tin',
  },
  people: [],
  departments: [{ id: 'it', name: 'Công nghệ thông tin' }],
  categories: [],
  managedDepartments: [],
  timeDepartments: [],
  supportDepartments: [],
};
