import { Component, OnInit } from '@angular/core';
import { MoodCat, User } from 'src/app/models/interfaces';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { MoodService } from 'src/app/services/mood.service';

@Component({
  selector: 'app-mood-categories',
  templateUrl: './mood-categories.page.html',
  styleUrls: ['./mood-categories.page.scss'],
})
export class MoodCategoriesPage implements OnInit {
  user: User | null = null;
  moodCats: MoodCat[] = [];

  constructor(private storage: LocalStorageService, private moodService: MoodService) {}

  ngOnInit() {
    this.storage.user$.subscribe((user) => {
      this.user = user;

      this.moodService.loadjson().subscribe((moodCats: MoodCat[]) => {
        if (user.moodCats && user.moodCats.length){
          moodCats.forEach((mC) => {
            const userMoodCat = user.moodCats.filter((userMC) => mC.id == userMC.id)[0]
            mC.isActive = userMoodCat.isActive;
          })
          this.moodCats = moodCats;
        } else {
          this.moodCats = moodCats;
        }
      })
    });
  }

  ionViewWillLeave(){
    this.user.moodCats = this.moodCats;
    this.storage.updateUser(this.user);
  }
}
