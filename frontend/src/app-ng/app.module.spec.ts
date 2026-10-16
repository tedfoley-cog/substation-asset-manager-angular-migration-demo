import { TestBed } from '@angular/core/testing';
import { UpgradeModule } from '@angular/upgrade/static';
import { AppModule, LEGACY_MODULE } from './app.module';

describe('AppModule hybrid bootstrap (WI-SETCMP-02, DES-SETCMP-005)', () => {
  it('ngDoBootstrap hands the whole document to UpgradeModule for the "sam" module with strict DI', () => {
    TestBed.configureTestingModule({ imports: [AppModule] });
    const upgrade = TestBed.inject(UpgradeModule);
    const bootstrap = spyOn(upgrade, 'bootstrap').and.stub();

    TestBed.inject(AppModule).ngDoBootstrap();

    expect(bootstrap).toHaveBeenCalledOnceWith(document.documentElement, [LEGACY_MODULE], { strictDi: true });
    expect(LEGACY_MODULE).toBe('sam');
  });
});
