import { Component } from '@angular/core';

import { ShellComponent } from './core/layout/shell/shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  templateUrl: './app.html',
})
export class App {}
