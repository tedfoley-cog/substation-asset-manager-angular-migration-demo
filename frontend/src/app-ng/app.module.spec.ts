import { TestBed } from '@angular/core/testing';
import { UpgradeModule } from '@angular/upgrade/static';
import { AppModule } from './app.module';

describe('AppModule (toolchain smoke, WI-SETCMP-01)', () => {
  it('compiles and exposes UpgradeModule', () => {
    TestBed.configureTestingModule({ imports: [AppModule] });
    expect(TestBed.inject(UpgradeModule)).toBeTruthy();
  });
});
