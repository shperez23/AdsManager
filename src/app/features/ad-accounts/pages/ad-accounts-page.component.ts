import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { AdaccountDetailComponent } from '../components/adaccount-detail/adaccount-detail.component';
import { AdaccountsListComponent } from '../components/adaccounts-list/adaccounts-list.component';

@Component({
  selector: 'app-ad-accounts-page',
  standalone: true,
  imports: [CommonModule, AdaccountsListComponent, AdaccountDetailComponent],
  templateUrl: './ad-accounts-page.component.html',
})
export class AdAccountsPageComponent implements OnInit {
  selectedAdAccountId: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.selectedAdAccountId = params.get('id');
    });
  }
}
