import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { EntityInsightsPanelComponent } from '../components/entity-insights-panel/entity-insights-panel.component';

type InsightsTab = 'campaigns' | 'adsets' | 'ads';

@Component({
  selector: 'app-insights-page',
  standalone: true,
  imports: [CommonModule, EntityInsightsPanelComponent],
  templateUrl: './insights-page.component.html',
})
export class InsightsPageComponent {
  selectedTab: InsightsTab = 'campaigns';

  readonly tabs: Array<{ key: InsightsTab; label: string }> = [
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'adsets', label: 'Ad Sets' },
    { key: 'ads', label: 'Ads' },
  ];

  onSelectTab(tab: InsightsTab): void {
    this.selectedTab = tab;
  }
}
