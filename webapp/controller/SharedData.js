/*global _*/
sap.ui.define([],
	function () {
		var oCurrentRequest = null;
		var oApplicationSettings = null;
		var sRootLoaded = false;
		var aUpperLevelJobs = [];
		var oCandidateProcess = {};
		var oApplicationAuth = {};
		var oCurrentUser = {};
		var sForceRefresh = false;

		return {
			setCurrentRequest: function (oRequest) {
				oCurrentRequest = _.cloneDeep(oRequest);
			},
			getCurrentRequest: function () {
				return oCurrentRequest;
			},
			setApplicationSettings: function (oSettings) {
				oApplicationSettings = _.cloneDeep(oSettings);
			},
			getApplicationSettings: function () {
				return oApplicationSettings;
			},
			setApplicationAuth: function (oAuth) {
				oApplicationAuth = _.cloneDeep(oAuth);
			},
			getApplicationAuth: function () {
				return oApplicationAuth;
			},
			setRootLoaded: function () {
				sRootLoaded = true;
			},
			getRootLoaded: function () {
				return sRootLoaded;
			},
			setUpperLevelJobs: function (aJobs) {
				aUpperLevelJobs = aJobs;
			},
			getUpperLevelJobs: function () {
				return aUpperLevelJobs;
			},
			setCandidateProcess: function (oProcess) {
				oCandidateProcess = _.cloneDeep(oProcess);
			},
			getCandidateProcess: function () {
				return oCandidateProcess;
			},
			setCurrentUser: function (oUser) {
				oCurrentUser = _.cloneDeep(oUser);
			},
			getCurrentUser: function () {
				return oCurrentUser;
			},
			setForceRefresh: function (sRefresh) {
				sForceRefresh = sRefresh;
			},
			getForceRefresh: function () {
				return sForceRefresh;
			}
		};
	}
);