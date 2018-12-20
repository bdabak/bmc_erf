/*global location*/
/*global _*/
sap.ui.define([
	"com/bmc/hcm/erf/controller/BaseController",
	"com/bmc/hcm/erf/controller/SharedData",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/bmc/hcm/erf/utils/FormValidator",
	"sap/m/MessageToast",
	"com/bmc/hcm/erf/model/formatter"
], function (
	BaseController,
	SharedData,
	JSONModel,
	History,
	Filter,
	FilterOperator,
	FormValidator,
	MessageToast,
	formatter
) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.CandidateProcessApproval", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the employeerequest controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oProcessApprovalModel = new JSONModel();

			this.getRouter().getRoute("candidateprocessapproval").attachPatternMatched(this._onCandidateProcessApprovalMatched, this);
			this.setModel(oProcessApprovalModel, "processApprovalModel");

			this._initiateModels();
			this.initOperations();
		},

		onExit: function () {
			this._initiateModels();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		onNavBack: function (oEvent) {
			this._initiateModels();
			this.goBack(History);
		},

		onUpdateStarted: function () {

		},
		onUpdateFinished: function () {

		},
		onEmployeeRequestFormPrintOut: function (oEvent) {
			var oModel = this.getModel();
			var oSource = oEvent.getSource();
			var oProcess = oModel.getProperty(oSource.getBindingContext().sPath);
			var sPrintOutPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/EmployeeRequestFormSet('" +
				oProcess.Erfid + "')/EmployeeRequestPrintOut/$value";
			var sPlstx = oProcess.Nopln ? oProcess.Plaft : oProcess.Plstx;
			var sPrintOutTitle = this.getText("REQUEST_PRINT_OUT_TITLE", [sPlstx]);

			this._callPDFViewer(sPrintOutPath, sPrintOutTitle);
		},
		onProcessDetail: function (oEvent) {
			var oModel = this.getModel();
			var oSource = oEvent.getSource();
			var oProcess = oModel.getProperty(oSource.getBindingContext().sPath);
			SharedData.setCandidateProcess({
				"Erfid": oProcess.Erfid,
				"Tclas": oProcess.Tclas,
				"Pernr": oProcess.Pernr
			});

			this.getRouter().navTo("candidateprocess");
		},
		onCandidateResumePrintOut: function (oEvent) {
			var oModel = this.getModel();
			var oSource = oEvent.getSource();
			var oProcess = oModel.getProperty(oSource.getBindingContext().sPath);
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateResumeSet(Tclas='" + oProcess.Tclas + "'," +
				"Pernr='" + oProcess.Pernr + "')/$value";
			var sTitle = this.getText("CANDIDATE_RESUME", [oProcess.Ename,
				this.getText(oProcess.Tclas === 'A' ? "INTERNAL_APPLICANT" : "EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Initiate models
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_initiateModels: function () {
			var oProcessApprovalModel = this.getModel("processApprovalModel");

			oProcessApprovalModel.setData({
				busy: false
			});
		},
		/**
		 * Pattern matched
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onCandidateProcessApprovalMatched: function (oEvent) {
			this.onRefresh();
		},

		onRefresh: function () {
			var oTable = this.byId("idCandidateApprovalListTable");
			oTable.getBinding("items").refresh();
		}

	});

});