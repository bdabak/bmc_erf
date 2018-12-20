/*global location*/
sap.ui.define([
	"com/bmc/hcm/erf/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/bmc/hcm/erf/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/util/ExportType",
	"com/bmc/hcm/erf/controller/SharedData"
], function (
	BaseController,
	JSONModel,
	History,
	formatter,
	Filter,
	FilterOperator,
	Export,
	ExportTypeCSV,
	ExportType,
	SharedData
) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.CandidateList", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				SearchResults: {
					"C": 0,
					"P": 0,
					"R": 0
				},
				FilterBarExpanded: false,
				CandidateActionSettings: {
					DiscardFromPool: false,
					AssignToPotential: false,
					AssignToRejected: false,
					ActionsColumnVisible: true,
					SelectColumnVisible: false,
					EditCandidate: false
				},
				Filters: {
					"Cplty": "C",
					"Ename": "",
					"Gesch": "",
					"Slart": "",
					"Wdart": "",
					"Lstcm": "",
					"Lstps": "",
					"Cansr": "",
					"Hscmn": false,
					"Hasrf": false,
					"Isvic": false
				}
			});

			this.getRouter().getRoute("candidatelist").attachPatternMatched(this._onCandidateListMatched, this);

			this.setModel(oViewModel, "candidateListModel");
			this.initOperations();
		},
		onNavBack: function () {
			this.goBack(History);
		},
		//CandidateList
		onToggleFilterBar: function () {
			var oViewModel = this.getModel("candidateListModel");
			var sExpanded = oViewModel.getProperty("/FilterBarExpanded");
			oViewModel.setProperty("/FilterBarExpanded", sExpanded ? false : true);
		},

		_getFilters: function (sExceptCplty) {
			var oViewModel = this.getModel("candidateListModel");
			var oFilter = oViewModel.getProperty("/Filters");
			var aFilters = [];
			if (!sExceptCplty) {
				if (oFilter.Cplty !== "") {
					aFilters.push(new Filter("Cplty", FilterOperator.EQ, oFilter.Cplty));
				}
			}
			if (oFilter.Ename !== "") {
				aFilters.push(new Filter("Ename", FilterOperator.EQ, oFilter.Ename));
			}
			if (oFilter.Gesch !== "") {
				aFilters.push(new Filter("Gesch", FilterOperator.EQ, oFilter.Gesch));
			}
			if (oFilter.Slart !== "") {
				aFilters.push(new Filter("Slart", FilterOperator.EQ, oFilter.Slart));
			}
			if (oFilter.Wdart !== "") {
				aFilters.push(new Filter("Wdart", FilterOperator.EQ, oFilter.Wdart));
			}
			if (oFilter.Lstcm !== "") {
				aFilters.push(new Filter("Lstcm", FilterOperator.EQ, oFilter.Lstcm));
			}
			if (oFilter.Lstps !== "") {
				aFilters.push(new Filter("Lstps", FilterOperator.EQ, oFilter.Lstps));
			}
			if (oFilter.Hscmn) {
				aFilters.push(new Filter("Hscmn", FilterOperator.EQ, oFilter.Hscmn));
			}
			if (oFilter.Hasrf) {
				aFilters.push(new Filter("Hasrf", FilterOperator.EQ, oFilter.Hasrf));
			}
			if (oFilter.Isvic) {
				aFilters.push(new Filter("Isvic", FilterOperator.EQ, oFilter.Isvic));
			}
			if (oFilter.Cansr) {
				aFilters.push(new Filter("Cansr", FilterOperator.EQ, oFilter.Cansr));
			}
			return aFilters;
		},
		onShowReference: function (oEvent) {
			var oSource = oEvent.getSource();
			sap.m.MessageToast.show(this.getText("REFERENCE_PERSON", oSource.data("referenceName")));
		},
		onCommentDialogClose: function () {
			this._oCandidateNotesDialog.close();
		},
		onShowCandidateComments: function (oEvent) {
			var oSource = oEvent.getSource();
			var sPernr = oSource.data("candidateNumber");
			var sEname = oSource.data("candidateName");
			var oModel = this.getModel();
			var oThis = this;
			var oViewModel = this.getModel("candidateListModel");
			var oNotesModel = this.getModel("candidateNotes");
			if (!oNotesModel) {
				oNotesModel = new JSONModel({
					Notes: []
				});
				this.setModel(oNotesModel, "CandidateNotes");
			}

			if (!this._oCandidateNotesDialog) {
				// create dialog via fragment factory
				this._oCandidateNotesDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.CandidateNotesDisplay", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oCandidateNotesDialog);
			}

			this._oCandidateNotesDialog.setTitle(this.getText("COMMENTS_ABOUT_CANDIDATE", [sEname]));

			var aFilters = [
				new Filter("Tclaskey", FilterOperator.EQ, "B"),
				new Filter("Pernrkey", FilterOperator.EQ, sPernr)
			];
			oViewModel.setProperty("/busy", true);
			oNotesModel.setProperty("/Notes", []);
			oModel.read("/CandidateNotesSet", {
				filters: aFilters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					oNotesModel.setProperty("/Notes", oData.results);
					oThis._oCandidateNotesDialog.open();
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
		},
		onApplyCandidateFilter: function () {
			var oTable = this.byId("idCandidatePoolTable");
			if (!oTable) {
				oTable = sap.ui.getCore().byId("idCandidatePoolTable");
			}
			oTable.getBinding("items").filter(this._getFilters(false), "Application");
		},
		onResetCandidateFilter: function () {
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/Filters/Ename", "");
			oViewModel.setProperty("/Filters/Gesch", "");
			oViewModel.setProperty("/Filters/Slart", "");
			oViewModel.setProperty("/Filters/Wdart", "");
			oViewModel.setProperty("/Filters/Lstcm", "");
			oViewModel.setProperty("/Filters/Lstps", "");
			oViewModel.setProperty("/Filters/Cansr", "");
			oViewModel.setProperty("/Filters/Hscmn", false);
			oViewModel.setProperty("/Filters/Hasrf", false);
			oViewModel.setProperty("/Filters/Isvic", false);

			this.onApplyCandidateFilter();
		},

		onPoolFilterSelect: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			var sKey = oEvent.getParameter("key");

			oViewModel.setProperty("/Filters/Cplty", sKey);

			this.onApplyCandidateFilter();

		},
		onCandidateListUpdateStarted: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/busy", true);
		},
		onCandidateListUpdated: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			var oModel = this.getModel();
			var aFilters = [];
			var oThis = this;
			var oSearchResults = oViewModel.getProperty("/SearchResults");

			oViewModel.setProperty("/busy", false);

			Object.keys(oSearchResults).forEach(function (sKey) {
				aFilters = oThis._getFilters(true);
				aFilters.push(new Filter("Cplty", FilterOperator.EQ, sKey));
				oModel.read("/CandidatePoolSet/$count", {
					filters: aFilters,
					success: function (oData, oResponse) {
						oViewModel.setProperty("/SearchResults/" + sKey, oResponse.body);
					},
					error: function (oError) {
						oViewModel.setProperty("/SearchResults/" + sKey, 0);
					}
				});

			});
		},
		onCandidateActionSheet: function (oEvent) {
			var oSource = oEvent.getSource();
			if (!this._oCandidateActionSheet) {
				this._oCandidateActionSheet = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.CandidateListActions",
					this
				);
				this.getView().addDependent(this._oCandidateActionSheet);
			}
			var oLine = this.getModel().getProperty(oSource.getParent().getBindingContextPath());
			this._oCandidateActionSheet.data("CandidateLine", oLine);
			var oViewModel = this.getModel("candidateListModel");
			var oSettings = oViewModel.getProperty("/CandidateActionSettings");
			if (oSettings.EditCandidate) {
				oSettings.DiscardFromPool = oLine.Cplty === "" ? false : true;
				oSettings.AssignToPotential = oLine.Cplty === "P" ? false : true;
				oSettings.AssignToRejected = oLine.Cplty === "R" ? false : true;

			} else {
				oSettings.DiscardFromPool =
					oSettings.AssignToPotential =
					oSettings.AssignToRejected = false;
			}
			oViewModel.setProperty("/CandidateActionSettings", oSettings);

			this._oCandidateActionSheet.openBy(oSource);
		},
		onCandidateListResume: function (oEvent) {
			var oLine = this._oCandidateActionSheet.data("CandidateLine");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateResumeSet(Tclas='B'," +
				"Pernr='" + oLine.Pernr + "')/$value";
			var sTitle = this.getText("CANDIDATE_RESUME", [oLine.Ename,
				this.getText("EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},
		onChangeCandidatePool: function (oEvent) {
			var oSource = oEvent.getSource();
			var sCplty = oSource.data("poolType");
			var oModel = this.getModel();
			var oThis = this;
			var oLine = this._oCandidateActionSheet.data("CandidateLine");

			var _assignConfirmed = function () {
				var oUrlParameters = {
					"Pernr": oLine.Pernr,
					"Cplty": sCplty
				};
				oThis._openBusyFragment(oThis.getText("POOL_ASSIGN_STARTED"));
				oModel.callFunction("/SetCandidatePool", {
					method: "POST",
					urlParameters: oUrlParameters,
					success: function (oData, oResponse) {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("POOL_ASSIGN_SUCCESSFUL"), "S");
						oModel.refresh();
					},
					error: function (oError) {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("POOL_ASSIGN_FAILED"), "E");
					}
				});

			};

			var oBeginButtonProp = {
				text: oSource.getText(),
				type: oSource.getType(),
				icon: oSource.getIcon(),
				onPressed: _assignConfirmed
			};

			this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("POOL_ASSIGN_CONFIRMATION"),
				oBeginButtonProp, null).open();
		},
		onCandidateListEdit: function (oEvent) {
			var oLine = this._oCandidateActionSheet.data("CandidateLine");
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("candidateedit", {
				Pernr: oLine.Pernr
			});
		},
		onPressCandidate: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			var sPernr = oEvent.getSource().getBindingContext().getProperty("Pernr");
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("candidateedit", {
				Pernr: sPernr
			});
		},
		onNewCandidateCreate: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("candidatecreate");
		},
		onDataExport: function (oEvent) {

			// var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidatePoolSet?$filter=Cplty eq 'C'&$format=xlsx";

			// sap.m.URLHelper.redirect(sPath, true);

			// return;
			var oExport = new Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats

				exportType: new ExportTypeCSV({
					separatorChar: ";"
				}),

				// Pass in the model created above
				models: this.getModel(),

				// binding information for the rows aggregation
				rows: {
					path: "/CandidatePoolSet"
				},

				// column definitions with column name and binding info for the content

				columns: [{
					name: "Aday Havuzu",
					template: {
						content: "{Cplty}"
					}
				}, {
					name: "Aday Numarası",
					template: {
						content: "{Pernr}"
					}
				}, {
					name: "Adayın Adı Soyadı",
					template: {
						content: "{Ename}"
					}
				}, {
					name: "Cinsiyeti",
					template: {
						content: "{Gescx}"
					}
				}, {
					name: "Doğum Tarihi",
					template: {
						content: "{ path:'Gbdat', type: 'sap.ui.model.type.Date', formatOptions:{ UTC: true, pattern: 'dd.MM.yyyy'}}"
					}
				}, {
					name: "Eğitim Durumu",
					template: {
						content: "{Slarx}"
					}
				}, {
					name: "Askerlik Durumu",
					template: {
						content: "{Wdarx}"
					}
				}, {
					name: "Telefonu",
					template: {
						content: "{Phone}"
					}
				}, {
					name: "Şirketi",
					template: {
						content: "{Lstcm}"
					}
				}, {
					name: "Görevi",
					template: {
						content: "{Lstps}"
					}
				}, {
					name: "Referans Bilgisi",
					template: {
						content: {
							parts: ["Hasrf", "Isvic", "Refnm"],
							formatter: function (sHasrf, sIsvic, sRefnm) {
								if (sHasrf) {
									return (sIsvic ? "VIP Referans," : "Normal Referans,") + sRefnm;
								} else {
									return "Hayır";
								}
							}
						}
					}
				}, {
					name: "Aday Kaynağı",
					template: {
						content: "{Cansx}"
					}
				}]
			});

			// download exported file
			oExport.saveFile("Aday_Listesi").catch(function (oError) {}).then(function () {
				oExport.destroy();
			});
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onCandidateListMatched: function (oEvent) {
			this.getModel().refresh(true);
			var oViewModel = this.getModel("candidateListModel");
			var oSettings = oViewModel.getProperty("/CandidateActionSettings");
			if (!SharedData.getApplicationAuth().ErfrcApp) {
				oSettings.DiscardFromPool =
					oSettings.AssignToPotential =
					oSettings.AssignToRejected =
					oSettings.EditCandidate = false;

			} else {
				oSettings.EditCandidate = true;
			}

			oViewModel.setProperty("/CandidateActionSettings", oSettings);
		}

	});

});