import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { AdAccount } from '../../../../shared/models';

@Component({
  selector: 'app-adaccount-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adaccount-detail.component.html',
})
export class AdaccountDetailComponent {
  @Input() adAccountId: string | null = null;
  @Input() adAccount: AdAccount | null = null;
}
