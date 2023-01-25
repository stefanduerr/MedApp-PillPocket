import { ActivatedRoute } from '@angular/router';

import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip
} from 'chart.js';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Mood } from 'src/app/models/interfaces';
import * as moment from 'moment';
import { MoodService } from 'src/app/services/mood.service';
import { BehaviorSubject } from 'rxjs';
import { first, takeWhile } from 'rxjs/operators';
import { ObservablesService } from 'src/app/services/observables.service';

@Component({
  selector: 'app-mood-stats',
  templateUrl: './mood-stats.page.html',
  styleUrls: ['./mood-stats.page.scss'],
})
export class MoodStatsPage implements OnInit {
  // Importing ViewChild. We need @ViewChild decorator to get a reference to the local variable 
  // that we have added to the canvas element in the HTML template.

  // @ViewChild('doughnutCanvas') private doughnutCanvas: ElementRef;
  // @ViewChild('barCanvas') private barCanvas: ElementRef;
  @ViewChild('lineCanvas') private lineCanvas: ElementRef;

  barChart: any;
  doughnutChart: any;
  lineChart: any;
  isLoading: boolean = false;
  dataIsPreparing$ = new BehaviorSubject<boolean>(false);
  timeOfInterest: string[];
  pinName: string = "1 Woche";

  prefereDark = null;
  isDarkMode = false;
  gridColor = 'rgba(255,255,255,1)';
  gridBorderColor = 'rgba(50,50,50,1)';

  // color of each chart-line
  backgroundColors = [
    "rgba(94, 96, 206,1)",
    "rgba(103, 205, 64,1)",
    "rgba(255, 190, 11,1)",
    "rgba(131, 56, 236,1)",
    "rgba(251, 86, 7,1)",
    "rgba(83, 144, 217,1)",
    "rgba(182, 98, 2,1)",
    "rgba(193, 28, 173,1)",
    "rgba(214, 40, 40,1)",
    "rgba(71, 107, 155,1)",
    "rgba(255, 0, 110,1)",
    "rgba(214, 133, 156,1)",
    "rgba(142, 236, 245,1)",
    "rgba(42, 157, 143,1)",
  ];

  dataSets = [];
  // pro Mood Categorie = 1 DataSet
  // Bsp 1 Dataset:
  // Kategorie: Schmerzen
  // Values: [{date: 13.01.22, val: 0}, {date: 13.01.22, val: 2}, {date: 13.01.22, val: 3}, {date: 13.01.22, val: 3}]

  // x-Axis Labels (days)
  labels = [];
  // mood-category names of each category
  moodLabels = [];

  constructor(private route: ActivatedRoute, private storage: LocalStorageService, private moodService: MoodService, private obs: ObservablesService) {
    this.timeOfInterest = [...new Array(7)].map((i, idx) => moment().startOf("day").subtract(idx, "days").format("DD.MM")).reverse();
  }

  ionViewWillEnter() {
    this.prepareLineChartData();
    this.obs.isDarkMode$.subscribe((isDark) => {
      this.switchDarkMode(isDark);
    })
  }

  ngOnInit() {
  }

  switchDarkMode(isDark) {

    if (isDark) {
      this.gridColor = 'rgba(50,50,50,1)';
      this.gridBorderColor = 'rgba(200,200,200,1)';
    } else {
      this.gridColor = 'rgba(200,200,200,1)';
      this.gridBorderColor = 'rgba(50,50,50,1)';
    }

    this.dataIsPreparing$.pipe(first(el => !el)).subscribe(async () => {
      try {
        await this.lineChart.destroy();
        this.lineChartMethod();
      } catch (e) {
        console.log(e)
      }
    })
  }

  async prepareLineChartData() {
    // clear previous data
    this.dataSets = [];
    this.labels = [];
    this.moodLabels = [];

    // last ... days of chart x-Axes
    this.labels = this.timeOfInterest;

    this.dataIsPreparing$.next(true);

    // load mood-category-data from JSON
    this.moodService.loadjson().subscribe((moodInterfaces) => {

      // When categories finally loaded, load moods from storage/database that user has saved 
      this.storage.loadAllMoods().then(async (res) => {
        console.log("LOADING ALL MOODS: ");
        console.log(res);

        // if there is data from storage/database:
        // -> run algorythm to prepare dataset for chart
        if (res) {

          // moodCats merges and prepares data from Array of Moods from storage/database
          let moodCats = [];

          // Go through each mood and merge all values of each category
          res.forEach((mood: Mood, i) => {

            // get index (0 if found, -1 if not)
            const mCIndex = moodCats.findIndex((mC) => mC.cat == mood.category);

            // convert selectedVal from string to number
            mood.selectedVal = Number(mood.selectedVal)

            // check if category already exists in our helper-array moodCats
            // if exists => push new value into mood category value-array
            // if not => create moodcategory object in helper array moodCats
            if (mCIndex >= 0) {
              moodCats[mCIndex].values.push({ date: moment(mood.date).format("DD.MM"), val: mood.selectedVal });
            }
            else {
              const obj = {
                title: mood.title,
                cat: mood.category,
                values: [{ date: moment(mood.date).format("DD.MM"), val: mood.selectedVal }]
              }
              moodCats.push(obj);
            }
          });

          // for each category => create dataset
          moodCats.forEach((mood, i) => {

            const filterRes = moodInterfaces.filter(mc => mc.id == mood.cat);
            const moodValLength = filterRes[0].btns.length;

            mood.values = mood.values.map(mv => {
              // (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
              const inMin = 0;
              const inMax = moodValLength - 1;
              const outMin = 0;
              const outMax = 6;

              // function to map values to another range
              let mapped = (mv.val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
              // revert numbers from 0-6 to 6-0
              mapped = (mapped * -1) + 6

              return { date: mv.date, val: mapped }
            })

            // sort array of values of each mood-category by date
            mood.values.sort((a, b) => {

              if (a.date < b.date) return -1;

              if (a.date > b.date) return 1;

              return 0;
            });

            // creates helper-arrays to filter and prepare data in each mood-category-object
            const moodArr = new Array(this.timeOfInterest.length).fill(null);
            const dottedArr = new Array(this.timeOfInterest.length).fill(null);

            // go through each day of the chart that will be shown on frontend:
            // -> if there is no value/null value -> register to dottedArr
            // these registered null values will then be shown as dashed lines on chart between correct values
            let savedVal = null;
            this.timeOfInterest.forEach((ltd, i) => {

              const mvIndex = mood.values.findIndex((mv) => mv.date === ltd);

              if (mvIndex >= 0) {
                moodArr[i] = mood.values[mvIndex].val;
                dottedArr[i] = moodArr[i];
                savedVal = moodArr[i];
              }
              else if (savedVal) {
                moodArr[i] = null;
                dottedArr[i] = -1;
                savedVal = null;
              } else {
                moodArr[i] = null;
                dottedArr[i] = -1;
                savedVal = mood.values.find((mv, j) => mv.val != null && j > i);
              }

              // other variants, where first and last date has a point, even if there is no value

              // else if (!savedVal) {
              //   moodArr[i] = mood.values[0].val;
              //   foundVal = true;
              //   savedVal = mood.values[0].val;
              //   dottedArr[i] = -1;
              // } else if(foundVal) {
              //   moodArr[i] = null;
              //   dottedArr[i] = -1;
              // } else {
              //   moodArr[i] = savedVal;
              //   foundVal = true;
              //   dottedArr[i] = -1;
              // }

              // else if (!(i == 0 || (i == timeOfInterest.length-1))) {
              //   moodArr[i] = null;
              //   dottedArr[i] = -1;
              // } else if(i == 0 || (i == timeOfInterest.length-1)) {
              //   moodArr[i] = null;
              //   dottedArr[i] = -1;
              // }

              // else if (savedVal && (i != timeOfInterest.length - 1)) {
              //   moodArr[i] = null;
              //   dottedArr[i] = -1;
              // } 
              // else {
              //   savedVal = mood.values.find((mv) => mv != null).val;
              //   moodArr[i] = savedVal;
              //   dottedArr[i] = -1;
              // }

            });

            const label = moodInterfaces[mood.cat].title;
            this.moodLabels.push(label);

            const dataSet = {
              label: label,                                            // label of the current mood-category
              fill: false,                                             // fills out the whole area of below the lines
              backgroundColor: this.backgroundColors[i],
              borderColor: this.backgroundColors[i],                   // defined colors of each line
              borderCapStyle: 'butt',
              borderDashOffset: 0.0,
              borderJoinStyle: 'miter',
              pointBorderColor: this.backgroundColors[i],
              pointBackgroundColor: '#fff',
              pointBorderWidth: 3,
              pointHoverRadius: 3,
              pointHoverBackgroundColor: 'rgba(75,192,192,1)',         // hover-background-color of each point
              pointHoverBorderColor: 'rgba(220,220,220,1)',            // hover-border-color of each point
              pointHoverBorderWidth: 2,
              pointRadius: 1,                                          // radius of the points of each value
              pointHitRadius: 10,
              data: moodArr,                                           // prepared Data for chart line
              segment: {

                borderDash: (ctx) => {

                  // for each value check if null
                  // if null -> draw dashed line
                  if (ctx.p0DataIndex == 0 && dottedArr[ctx.p0DataIndex] < 0) {
                    return [2, 2]
                  }
                  else if (ctx.p1DataIndex + 1 == dottedArr.length && dottedArr[ctx.p1DataIndex] < 0) {
                    return [2, 2]
                  }
                  else if ((ctx.p1DataIndex >= dottedArr.length && dottedArr[ctx.p1DataIndex] < 0) || dottedArr[ctx.p0DataIndex] < 0) {
                    return [2, 2]
                  }
                }

              }
            }

            this.dataSets.push(dataSet);
          });
        }

        this.dataIsPreparing$.next(false);
        try {
          await this.lineChart.destroy();
          this.lineChartMethod();
        } catch (e) { }
        this.lineChart.update();
      });
    })
  }

  customFormatter(value: number) {

    switch (value) {
      case 0:
        return "1 W";
      case 1:
        return "2 W";
      case 2:
        return "1 M";
      case 3:
        return "3 M";
      case 4:
        return "6 M";
      case 5:
        return "1 J";
      default:
        return "1 W";
    }
  }

  async ngAfterViewInit() {

    this.dataIsPreparing$.pipe(first(el => !el)).subscribe(() => {
      try {
        this.lineChart.destroy();
      } catch (e) {
        console.log(e)
      }

      Chart.register(
        ArcElement,
        LineElement,
        BarElement,
        PointElement,
        BarController,
        BubbleController,
        DoughnutController,
        LineController,
        PieController,
        PolarAreaController,
        RadarController,
        ScatterController,
        CategoryScale,
        LinearScale,
        LogarithmicScale,
        RadialLinearScale,
        TimeScale,
        TimeSeriesScale,
        Decimation,
        Filler,
        Legend,
        Title,
        Tooltip
      );
      // this.barChartMethod();
      // this.doughnutChartMethod();
      this.lineChartMethod();

    })
  }

  ngOnDestroy() {
    this.lineChart.destroy();
  }

  lineChartMethod() {
    const legendMargin = {
      id: 'legendMargin',
      beforeInit(chart, legend, options) {
        const fitValue = chart.legend.fit;
        chart.legend.fit = function fit() {
          fitValue.bind(chart.legend)();
          return this.height += 20;
        }
      }
    }

    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      options: {
        spanGaps: true,
        locale: "de-DE",
        scales: {
          xAxes: {
            grid: {
              color: this.gridColor,
              // tickColor: '#FFFFFF',
              borderColor: this.gridBorderColor,
            },
          },
          yAxes: {
            grid: {
              color: this.gridColor,
              // tickColor: '#FFFFFF',
              borderColor: this.gridBorderColor,
            },
            ticks: {
              callback: (label) => {
                switch (label) {
                  case 0:
                    return 'Schlecht';
                  case 6:
                    return 'Gut';
                }
              },
              stepSize: 1,
              maxTicksLimit: 6,
            },
            max: 6.5,
            min: 0,
          }
        },
        maintainAspectRatio: false,
      },
      data: {
        labels: this.labels,
        datasets: this.dataSets,
      },
      plugins: [legendMargin]
    });
  }

  async updateTime($event) {
    const val = $event.target.value;
    let pinNumb = 7;

    switch (val) {
      case 0:
        pinNumb = 7;
        this.pinName = "1 Woche";
        break;
      case 1:
        pinNumb = 14;
        this.pinName = "2 Wochen";
        break;
      case 2:
        pinNumb = 30;
        this.pinName = "1 Monat";
        break;
      case 3:
        pinNumb = 30 * 3;
        this.pinName = "3 Monat";
        break;
      case 4:
        pinNumb = 30 * 6;
        this.pinName = "6 Monat";
        break;
      case 5:
        pinNumb = 365;
        this.pinName = "1 Jahr";
        break;
      default:
        return;
    }

    this.timeOfInterest = this.getLastXDays(pinNumb);
    this.prepareLineChartData();
  }

  async updateTimeOfInterest($event) {
    const str = $event.srcElement.innerHTML;

    switch (str) {
      case "2 Wochen":
        this.timeOfInterest = this.getLastXDays(14);
        break;
      case "1 Monat":
        this.timeOfInterest = this.getLastXDays(30);
        break;
      case "6 Monate":
        this.timeOfInterest = this.getLastXDays(30 * 6);
        break;
      default:
        break;
    }

    this.prepareLineChartData();
  }

  getLastXDays(days: number) {
    return [...new Array(days)].map((i, idx) => moment().startOf("day").subtract(idx, "days").format("DD.MM")).reverse();
  }

  // barChartMethod() {
  //   // Now we need to supply a Chart element reference with an object that defines the type of chart we want to use, and the type of data we want to display.
  //   this.barChart = new Chart(this.barCanvas.nativeElement, {
  //     type: 'bar',
  //     data: {
  //       labels: this.labels,
  //       datasets: [{
  //         label: '# of Votes',
  //         data: [200, 50, 30, 15, 20, 34],
  //         backgroundColor: [
  //           'rgba(255, 99, 132, 0.2)',
  //           'rgba(54, 162, 235, 0.2)',
  //           'rgba(255, 206, 86, 0.2)',
  //           'rgba(75, 192, 192, 0.2)',
  //           'rgba(153, 102, 255, 0.2)',
  //           'rgba(255, 159, 64, 0.2)'
  //         ],
  //         borderColor: [
  //           'rgba(255,99,132,1)',
  //           'rgba(54, 162, 235, 1)',
  //           'rgba(255, 206, 86, 1)',
  //           'rgba(75, 192, 192, 1)',
  //           'rgba(153, 102, 255, 1)',
  //           'rgba(255, 159, 64, 1)'
  //         ],
  //         borderWidth: 1
  //       }]
  //     },
  //     options: {
  //       scales: {
  //         y: {
  //           beginAtZero: true
  //         }
  //       }
  //     }
  //   });
  // }

  // doughnutChartMethod() {
  //   this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
  //     type: 'doughnut',
  //     data: {
  //       labels: ['BJP', 'Congress', 'AAP', 'CPM', 'SP'],
  //       datasets: [{
  //         label: '# of Votes',
  //         data: [50, 29, 15, 10, 7],
  //         backgroundColor: [
  //           'rgba(255, 159, 64, 0.2)',
  //           'rgba(255, 99, 132, 0.2)',
  //           'rgba(54, 162, 235, 0.2)',
  //           'rgba(255, 206, 86, 0.2)',
  //           'rgba(75, 192, 192, 0.2)'
  //         ],
  //         hoverBackgroundColor: [
  //           '#FFCE56',
  //           '#FF6384',
  //           '#36A2EB',
  //           '#FFCE56',
  //           '#FF6384'
  //         ]
  //       }]
  //     }
  //   });
  // }

}
