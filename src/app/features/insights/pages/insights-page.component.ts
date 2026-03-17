import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AdsListComponent } from '../../ads/components/ads-list/ads-list.component';

@Component({
  selector: 'app-insights-page',
  standalone: true,
  imports: [CommonModule, AdsListComponent],
  templateUrl: './insights-page.component.html',
})
export class InsightsPageComponent {}
