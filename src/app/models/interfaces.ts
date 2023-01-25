export interface User {
    id: string;
    name: string;
    email: string;
    age: number;
    takeMeds: TakeMeds[];
    moodCats: MoodCat[];
}


// add (uu-)id !
export interface TakeMeds {
    uid: string;
    name: string;
    description: string;
    unit: string;
    medsOClock: MedsOClock[],
    active: boolean;
    regularity: number[];
}

export interface MedsOClock {
    id: string;
    time: Date | string;
    amount: number;
    taken?: boolean;
}

export interface Mood {
    id: string;
    category: string;
    selectedVal: number;
    title: string;
    userid: string;
    date: Date
}

export interface Event {
    id: string;
    userid: string;
    title: string;
    startTime: Date | string;
    endTime: Date | string;
    desc: string;
    allDay: boolean;
}
export interface TodaysMeds{
    userid: string;
    date: string;
    medTime: MedTime[];
}
export interface MedTime{
    id: string;
    name: string; 
    unit: string; 
    medsOClock: MedsOClock [];
}
export interface MoodCat {
    id: string | number;
    title: string;
    isActive: boolean;
    btns: MoodButton[];
}
export interface MoodButton{
    url: string;
    title: string;
}