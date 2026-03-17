import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AdaccountsListComponent } from '../components/adaccounts-list/adaccounts-list.component';

@Component({
  selector: 'app-ad-accounts-page',
  standalone: true,
  imports: [CommonModule, AdaccountsListComponent],
  template: '<app-adaccounts-list></app-adaccounts-list>',
})
export class AdAccountsPageComponent {}
