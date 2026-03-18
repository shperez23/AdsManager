import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AdaccountDetailComponent } from '../components/adaccount-detail/adaccount-detail.component';
import { AdaccountsListComponent } from '../components/adaccounts-list/adaccounts-list.component';

@Component({
  selector: 'app-ad-accounts-page',
  standalone: true,
  imports: [CommonModule, AdaccountsListComponent, AdaccountDetailComponent],
  templateUrl: './ad-accounts-page.component.html',
})
export class AdAccountsPageComponent implements OnInit, OnDestroy {
  selectedAdAccountId: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.selectedAdAccountId = params.get('id');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
