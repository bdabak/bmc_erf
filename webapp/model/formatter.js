/*global moment*/
sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		convertZeroValue: function (sValue) {
			if (sValue === 0 || sValue == "0") {
				return "";
			} else {
				return sValue;
			}
		},
		convertToDecimalOne: function (sValue) {
			return parseFloat(sValue).toFixed(1);
		},
		convertZeroObjectNumber: function (sValue, sText) {
			if (sValue === "00000000") {
				return "";
			}
			return sText;
		},
		getDateTime: function (sDate, sTime) {
			return sDate.getTime() + sTime.ms;
		},
		getStatusText: function (sErfsx, sErfsy) {
			return sErfsy === '' ? sErfsx : sErfsx + '-' + sErfsy;
		},
		getObjectIcon: function (sOtype, sEmpid, sIsmng) {
			var sIcon = null;
			switch (sOtype) {
			case "O":
				sIcon = "sap-icon://folder-blank";
				break;
			case "S":
				sIcon = "sap-icon://person-placeholder";
				break;
			default:
			}

			return sIcon;

		},
		getObjectIconColor: function (sOtype, sEmpid, sIsmng) {
			var sColor = null;
			switch (sOtype) {
			case "S":
				sColor = sIsmng ? "#e02424" : "#4d8a72";
				break;
			default:
			}
			return sColor;

		},
		getFormActionType: function (sErfbs) {
			var sBtype = "Default";
			switch (sErfbs) {
			case "A":
				sBtype = "Accept";
				break;
			case "B":
				sBtype = "Emphasized";
				break;
			case "S":
				sBtype = "Emphasized";
				break;
			case "R":
				sBtype = "Reject";
				break;
			default:
			}
			return sBtype;
		},
		getFormActionEnabled: function (sReq, sNote, sReasonVisible, sCplty, sCpprr) {
			var sResult = sReq ? sNote.length > 10 : true;

			try {
				if (sReasonVisible && sResult) {
					sResult = sCplty !== "" && sCplty !== undefined;

					if (sResult) {
						sResult = sCpprr !== "" && sCpprr !== undefined;
					}
				}
			} catch (oEx) {
				sResult = false;
			}

			return sResult;
		},
		countItems: function (aResult) {
			try {
				return aResult ? aResult.length : 0;
			} catch (oErr) {
				return 0;
			}
		},
		calcYear: function (begda, endda) {
			var begin = moment(begda);
			var end = moment(endda);
			var year = end.diff(begin, "day");
			year = parseFloat(year / 365).toFixed(2).toString();
			return year;
		},
		setRestrictDate: function (sDate) {
			var sNow = new Date();
			sNow.setHours(9);
			return sNow;
		},
		setRestrictPastDate: function (sDate) {
			var sNow = new Date();
			sNow.setHours(9);
			return sNow;
		},
		setRestrictDateRelative: function (sDate) {
			var sTomorrow = new Date();
			sTomorrow.setDate(sTomorrow.getDate() + 1);
			if (moment(sDate).isValid() && sDate > sTomorrow) {
				sTomorrow = sDate;
			}
			return sTomorrow;
		}

	};

});