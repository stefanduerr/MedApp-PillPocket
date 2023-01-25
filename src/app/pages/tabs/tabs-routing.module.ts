import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/auth.guard';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'homepage',
        loadChildren: () => import('../homepage/homepage.module').then(m => m.HomepagePageModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'med-list',
        loadChildren: () => import('../med-list/med-list.module').then(m => m.MedListPageModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'moodDiary',
        loadChildren: () => import('../moodDiary/moodDiary.module').then(m => m.MoodDiaryPageModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'mood-stats',
        loadChildren: () => import('../mood-stats/mood-stats.module').then(m => m.MoodStatsPageModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'calendar',
        loadChildren: () => import('../calendar/calendar.module').then(m => m.CalendarPageModule),
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/homepage',
        pathMatch: 'full',
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/homepage',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
