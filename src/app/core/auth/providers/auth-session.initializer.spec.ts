import { ApplicationInitStatus, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';
import { provideAuthSessionInitializer } from './auth-session.initializer';

describe('provideAuthSessionInitializer', () => {
  let authSessionService: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    authSessionService = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'ensureAuthenticated',
    ]);
  });

  async function initializeApplication(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSessionService, useValue: authSessionService },
        provideAuthSessionInitializer(),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
  }

  it('should wait for the persisted session validation before finishing bootstrap', async () => {
    authSessionService.ensureAuthenticated.and.returnValue(of(true));

    await initializeApplication();

    expect(authSessionService.ensureAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('should not fail bootstrap when session validation throws', async () => {
    authSessionService.ensureAuthenticated.and.returnValue(
      throwError(() => new Error('refresh failed')),
    );

    await expectAsync(initializeApplication()).toBeResolved();
    expect(authSessionService.ensureAuthenticated).toHaveBeenCalledTimes(1);
  });
});
