import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AdAccount } from '../../../shared/models';
import { AdaccountDetailComponent } from '../components/adaccount-detail/adaccount-detail.component';
import { AdaccountsListComponent } from '../components/adaccounts-list/adaccounts-list.component';

@Component({
  selector: 'app-ad-accounts-page',
  standalone: true,
  imports: [CommonModule, AdaccountsListComponent, AdaccountDetailComponent],
  templateUrl: './ad-accounts-page.component.html',
})
export class AdAccountsPageComponent {
  selectedAdAccount: AdAccount | null = null;

  onViewDetail(account: AdAccount): void {
    this.selectedAdAccount = account;
  }
}
