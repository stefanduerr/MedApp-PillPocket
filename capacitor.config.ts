import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: "pillpocket.mobile.ps",
	appName: "PillPocket",
	webDir: "www",
	plugins: {
		SplashScreen: {
			launchAutoHide: false,
		},
		LocalNotifications: {
			smallIcon: "ic_stat_notif_icon",
			iconColor: "#486d9c",
			sound: "oida.wav",
		},
		// PushNotifications: {
		//   presentationOptions: ['alert', 'sound'],
		// },
	},
}

export default config;