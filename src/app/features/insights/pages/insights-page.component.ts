import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AdsListComponent } from '../../ads/components/ads-list/ads-list.component';
import { InsightsSummaryComponent } from '../components/insights-summary/insights-summary.component';

@Component({
  selector: 'app-insights-page',
  standalone: true,
  imports: [CommonModule, AdsListComponent, InsightsSummaryComponent],
  templateUrl: './insights-page.component.html',
})
export class InsightsPageComponent {}
