import { Component, inject } from '@angular/core';
import { TuiComparator, TuiTableModule, TuiTablePaginationModule } from '@taiga-ui/addon-table';
import { BehaviorSubject, combineLatest, filter, map, Observable, share, startWith } from 'rxjs';
import { IUser, TActiveFilter, TUserKey } from '../models/user.model';
import { tuiDefaultSort, tuiIsFalsy, tuiIsPresent, TuiLetModule } from '@taiga-ui/cdk';
import { UserService } from '../services/user/user.service';
import { TuiDialogService, TuiLoaderModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {
  TuiComboBoxModule,
  TuiDataListWrapperModule,
  TuiFilterByInputPipeModule,
  TuiInputModule,
} from '@taiga-ui/kit';
import { TuiDropdownMobileModule } from '@taiga-ui/addon-mobile';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {TuiCardModule, TuiSurfaceModule} from '@taiga-ui/experimental';

function sortBy(key: TUserKey, direction: -1 | 1): TuiComparator<IUser> {
  return (a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (key === 'id' || typeof aValue === 'number' || typeof bValue === 'number') {
      return direction * tuiDefaultSort(Number(aValue), Number(bValue));
    }

    return direction * tuiDefaultSort(String(aValue), String(bValue));
  };
}

export function filterByActive(users: readonly IUser[], activeFilter: string): readonly IUser[] {
  if (activeFilter === 'all') {
    return users;
  }
  return users.filter(user => user.active === activeFilter);
}

export function filterByName(users: readonly IUser[], nameFilter: string): readonly IUser[] {
  const lowerNameFilter = nameFilter.toLowerCase();
  return users.filter(user => user.name.toLowerCase().includes(lowerNameFilter));
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    TuiTableModule,
    TuiTablePaginationModule,
    TuiLoaderModule,
    AsyncPipe,
    NgIf,
    NgForOf,
    TuiLetModule,
    TuiComboBoxModule,
    TuiDropdownMobileModule,
    TuiTextfieldControllerModule,
    TuiDataListWrapperModule,
    TuiFilterByInputPipeModule,
    TuiInputModule,
    ReactiveFormsModule,
    TuiCardModule,
    TuiSurfaceModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  private readonly dialogs = inject(TuiDialogService);

  private userService = inject(UserService);

  readonly activeFilter = ['all', 'active', 'inactive'];

  protected active = new FormControl<TActiveFilter>('all', { nonNullable: true });
  protected name = new FormControl<string>('', { nonNullable: true });

  readonly activeFilter$ = this.active.valueChanges.pipe(startWith(this.active.value));
  readonly nameFilter$ = this.name.valueChanges.pipe(startWith(this.name.value));

  readonly direction$ = new BehaviorSubject<-1 | 1>(-1);
  readonly sorter$ = new BehaviorSubject<TUserKey>('name');

  readonly request$ = this.userService.getUsers().pipe(startWith(null), share());

  readonly loading$ = this.request$.pipe(map(tuiIsFalsy));

  columns = ['id', 'name', 'email', 'active'];

  readonly data$: Observable<readonly IUser[]> = combineLatest<
    [readonly IUser[], TUserKey, -1 | 1, TActiveFilter, string]
  >([
    this.request$.pipe(filter(tuiIsPresent)),
    this.sorter$,
    this.direction$,
    this.activeFilter$,
    this.nameFilter$,
  ]).pipe(
    map(([users, key, direction, activeFilter, nameFilter]) => {
      const filteredByActive = filterByActive(users, activeFilter);
      const filteredByName = filterByName(filteredByActive, nameFilter);

      return [...filteredByName].sort(sortBy(key, direction));
    }),
    startWith([]),
  );

  showDialog(user: IUser): void {
    this.dialogs
      .open(
        `<div>User ID: ${user.id}</div><div>User email: ${user.email}</div><div>User active status: ${user.active}</div>`,
        {
          label: `User: ${user.name}`,
          size: 's',
        },
      )
      .subscribe();
  }
}
