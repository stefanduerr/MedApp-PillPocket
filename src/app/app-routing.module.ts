import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule) },
  { path: 'callback', loadChildren: () => import('./pages/tabs/tabs-routing.module').then(m => m.TabsPageRoutingModule) },
  { path: 'logout', loadChildren: () => import('./pages/login-register/login-register-routing.module').then(m => m.LoginRegisterPageRoutingModule)},
  { path: 'tabs', loadChildren: () => import('./pages/tabs/tabs-routing.module').then(m => m.TabsPageRoutingModule)},
  { path: 'login-register', loadChildren: () => import('./pages/login-register/login-register-routing.module').then(m => m.LoginRegisterPageRoutingModule)},
  {
    path: 'edit-med',
    loadChildren: () => import('./components/edit-med/edit-med.module').then( m => m.EditMedPageModule)
  },
  {
    path: 'event-modal',
    loadChildren: () => import('./components/event-modal/event-modal.module').then( m => m.EventModalPageModule)
  },
  {
    path: 'mood-categories',
    loadChildren: () => import('./pages/mood-categories/mood-categories.module').then( m => m.MoodCategoriesPageModule)
  },
  {
    path: 'mood-stats',
    loadChildren: () => import('./pages/mood-stats/mood-stats.module').then( m => m.MoodStatsPageModule)
  },
  {
    path: 'profil',
    loadChildren: () => import('./pages/profil/profil.module').then( m => m.ProfilPageModule)
  }

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
