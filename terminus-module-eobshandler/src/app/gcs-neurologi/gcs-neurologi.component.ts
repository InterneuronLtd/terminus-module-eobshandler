//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2025  Interneuron Limited

//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

//See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program.If not, see<http://www.gnu.org/licenses/>.
//END LICENSE BLOCK 
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

import { ApirequestService } from '../services/apirequest.service';
import { SharedDataContainerService } from '../services/shared-data-container.service';
import { AuthenticationService } from '../services/authentication.service';
import { Gcsobservations } from '../models/person.model';
import { UpsertTransactionManager } from '../services/upsert-transaction-manager.service';
import { Graph2d, Graph2dOptions } from 'vis-timeline/standalone';
import { v4 as uuidv4 } from 'uuid';
import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import moment from 'moment';
import { AppService, BadgeNames } from '../services/app.service';
import { SubjectsService } from '../services/subjects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gcs-neurologi',
  templateUrl: './gcs-neurologi.component.html',
  styleUrl: './gcs-neurologi.component.css'
})
export class GCSNeurologiComponent implements OnDestroy {
  subscriptions: Subscription = new Subscription();
  showimg = false;
  showEdit = false;
  showDelete = false;
  ShowHistory = false;
  showEditHistory = false;
  observationtype: any;
  defaultMonitoringFrequencyData: any;
  Choosenfilterdate = new Date();
  public today = new Date();
  public mindate = new Date();
  public maxTime = new Date();
  public minTime = new Date();
  reasonforRefusal = ""
  patientrefuse = false;
  showpatientrefuselink = true;
  gcsobservations = new Gcsobservations();
  monitoringFrequencyData: any;
  GCSHistoryData: any[];
  GCSDetails: any;
  encounterId: string;
  monitoringFrequencyHistoryData = []

  RBACK_Add = false
  RBACK_Edit = false
  RBACK_Delete = false
  RBACK_PatientRefuse = false
  RBACK_Add_AddFrequency = false

  showerror1 = false;
  showerror2 = false;
  showerror3 = false;
  showError = false;
  showErrormessage = ""
  OthereReason = ""
  showGraph = false
  private graph2d: any;
  private graph2dEyes: any;
  private graph2dVerbal: any;
  private graph2dMotot: any;
  Observationshowmore = false
  editObservationshowmore = false

  rowForHistoryViewer = [
    {
      'id': 'datestarted',
      'fieldName': 'Observation Time'
    },
    {
      'id': 'totalscore',
      'fieldName': 'Total Score'
    },
    {
      'id': 'frequencyentered',
      'fieldName': 'Monitoring Frequency'
    },
    {
      'id': 'ispartial',
      'fieldName': 'Partial'
    },
    {
      'id': 'eyes',
      'fieldName': 'Eyes'
    },
    {
      'id': 'verbal',
      'fieldName': 'Verbal'
    },
    {
      'id': 'motor',
      'fieldName': 'Motor'
    },
    {
      'id': 'pupilrightsize',
      'fieldName': 'Right Size'
    },
    {
      'id': 'pupilrightreaction',
      'fieldName': 'Right reaction'
    },
    {
      'id': 'pupilleftsize',
      'fieldName': 'Left size'
    },
    {
      'id': 'pupilleftreaction',
      'fieldName': 'Left reaction'
    },
    {
      'id': 'limbleftarm',
      'fieldName': 'Left arm'
    },
    {
      'id': 'limbrightarm',
      'fieldName': 'Right arm'
    },
    {
      'id': 'limbleftleg',
      'fieldName': 'Left leg'
    },
    {
      'id': 'limbrightleg',
      'fieldName': 'Right leg'
    },
    {
      'id': 'monitoringreason',
      'fieldName': 'Reason'
    },
    {
      'id': 'completedby',
      'fieldName': 'Completed by'
    },
    {
      'id': 'submittedtime',
      'fieldName': 'Submitted Time'
    },
    {
      'id': 'reason',
      'fieldName': 'Reason for Refusal '
    },
    {
      'id': 'action',
      'fieldName': ''
    },
  ]
  selectedgcsobservations: any;
  RecordHistory: any;
  LatestRecordSelected: boolean;
  editshowError = false
  EditshowErrormessage: string;
  messageSuccess: boolean = false;
  showValidate7DayError: boolean = false;
  showEditValidate7DayError: boolean = false;
  currentRecordedFrequencyAndReason: string = '';

  constructor(public subject: SubjectsService, private apiRequest: ApirequestService, private sharedData: SharedDataContainerService, private authService: AuthenticationService, public appService: AppService) {
    this.RBACK_Add = this.appService.AuthoriseAction("eobs_add_Glasgow_Coma_Scale")
    this.RBACK_Edit = this.appService.AuthoriseAction("eobs_edit_Glasgow_Coma_Scale")
    this.RBACK_Delete = this.appService.AuthoriseAction("eobs_delete_Glasgow_Coma_Scale")
    this.RBACK_PatientRefuse = this.appService.AuthoriseAction("eobs_record _patient_refused_Glasgow_Coma_Scale")
    this.RBACK_Add_AddFrequency = this.appService.AuthoriseAction("eobs_set_frequency_Glasgow_Coma_Scale")
    this.observationtype = {
      'observationtype': 'GCSfrequency',
      'RBAC': this.appService.AuthoriseAction('eobs_set_frequency_Glasgow_Coma_Scale')
    }

    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;
    //  this.minTime.setHours(9, 0, 0); // Sets minTime to 9:00 AM

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.gcsobservations = new Gcsobservations();
    this.gcsobservations.eyes = "";
    this.gcsobservations.eyesvalue = null;
    this.gcsobservations.verbal = null;
    this.gcsobservations.verbalvalue = null;
    this.gcsobservations.motor = null;
    this.gcsobservations.motorvalue = null;
    this.gcsobservations.pupilrightsize = null;
    this.gcsobservations.pupilrightreaction = null;
    this.gcsobservations.pupilleftsize = null;
    this.gcsobservations.pupilleftreaction = null;
    this.gcsobservations.limbleftarm = null;
    this.gcsobservations.limbrightarm = null;
    this.gcsobservations.limbleftleg = null;
    this.gcsobservations.limbrightleg = null;

    this.encounterId = this.appService.encounter.encounter_id
    this.init()

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  init() {
    this.Choosenfilterdate = new Date();
    this.mindate = new Date()
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;

    this.minTime.setMinutes(this.minTime.getMinutes(), 0, 0)

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/terminus_getgcsobservationsdettails`, this.createFilter())
      .subscribe(
        (GCSDetails) => {
          this.GCSHistoryData = [];
          this.monitoringFrequencyHistoryData = []
          this.GCSDetails = GCSDetails       
          this.GCSDetails.sort((b, a) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
          for (let Obj of this.GCSDetails) {

            Obj.__history = JSON.parse(Obj.__history)

            if (Obj.patientrefused) {
              this.monitoringFrequencyHistoryData.push(
                {
                  'datestarted': moment(Obj.observationtime),
                  'totalscore': "Patient Refused",
                  'frequencyentered': Obj.frequencyentered + " " + Obj.frequencyunit,
                  'ispartial': "N/A",
                  'eyes': "N/A",
                  'verbal': "N/A",
                  'motor': "N/A",
                  'pupilrightsize': "N/A",
                  'pupilrightreaction': "N/A",
                  'pupilleftsize': "N/A",
                  'pupilleftreaction': "N/A",
                  'limbleftarm': "N/A",
                  'limbrightarm': "N/A",
                  'limbleftleg': "N/A",
                  'limbrightleg': "N/A",
                  'monitoringreason': Obj.monitoringreason == 'Other' ? Obj.monitoringreasonother : Obj.monitoringreason,
                  'completedby': Obj.completedby,
                  'submittedtime': moment(Obj.submittedtime).format('DD-MM-yyyy HH:mm'),
                  'reason': Obj.reasonforpatientrefused,
                  'gcsobservations_id': Obj.gcsobservations_id,

                  'action': '',
                  'observationevent_id': "",
                  'eventcorrelationid': "",
                  'isamended': Obj.isamended,
                  'isdeleted': Obj.isdeleted,
                  'clickedAction': '',
                  'showEdit': this.RBACK_Edit,
                  'showHistory': true,
                  'componentCalled': 'gsc-neurologi'
                })
            } else {
              this.monitoringFrequencyHistoryData.push(
                {
                  'datestarted': moment(Obj.observationtime),
                  'totalscore': Obj.totalscore,
                  'frequencyentered': Obj.monitoringnotrequired == true ? "Monitoring Stopped" : Obj.frequencyentered + " " + Obj.frequencyunit,
                  'ispartial': Obj.ispartial ? "Yes" : "",
                  'eyes': Obj.eyes,
                  'verbal': Obj.verbal,
                  'motor': Obj.motor,
                  'pupilrightsize': Obj.pupilrightsize,
                  'pupilrightreaction': Obj.pupilrightreaction,
                  'pupilleftsize': Obj.pupilleftsize,
                  'pupilleftreaction': Obj.pupilleftreaction,
                  'limbleftarm': Obj.limbleftarm,
                  'limbrightarm': Obj.limbrightarm,
                  'limbleftleg': Obj.limbleftleg,
                  'limbrightleg': Obj.limbrightleg,
                  'monitoringreason': Obj.monitoringreason == 'Other' ? Obj.monitoringreasonother : Obj.monitoringreason,
                  'completedby': Obj.completedby,
                  'submittedtime': moment(Obj.submittedtime).format('DD-MM-yyyy HH:mm'),
                  'reasonforpatientrefused': Obj.reasonforpatientrefused,
                  'gcsobservations_id': Obj.gcsobservations_id,

                  'action': '',
                  'observationevent_id': "",
                  'eventcorrelationid': "",
                  'isamended': Obj.isamended,
                  'isdeleted': Obj.isdeleted,
                  'clickedAction': '',
                  'showEdit': this.RBACK_Edit,
                  'showHistory': true,
                  'componentCalled': 'gsc-neurologi'
                })
            }
          }

          if (this.GCSDetails.length > 0) {
            if(!this.GCSDetails[0].monitoringnotrequired) {
              this.currentRecordedFrequencyAndReason = '- every '+this.monitoringFrequencyHistoryData[0].frequencyentered + ' - ' + this.monitoringFrequencyHistoryData[0].monitoringreason;
            }
            else {
              this.currentRecordedFrequencyAndReason = '';
            }
            
            this.defaultMonitoringFrequencyData = null
            this.defaultMonitoringFrequencyData = {
              'frequency_entered': GCSDetails[0].frequencyentered,
              'frequencyunit_entered': GCSDetails[0].frequencyunit,
              'monitoringnotrequired': GCSDetails[0].monitoringnotrequired,
              'isstop': GCSDetails[0].monitoringnotrequired,
              "frequency_reason": GCSDetails[0].monitoringreason,
              "frequency_reason_other": GCSDetails[0].monitoringreasonother

            }
          }

          else {
            this.defaultMonitoringFrequencyData = {

              'isstop': true,
              "frequency_reason": "Other",
              "frequency_reason_other": "Monitoring not started"


            }

          }
          this.loadChart()

        },

      )
    )
  }

  closeGCSModal() {
    this.subject.closeModal.next('close modal');
  }

  createFilter() {
    let condition = "personid = @personid and encounterid = @encounterid";
    //let condition = "personid = @personid";

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("personid", this.appService.personId));
    pm.filterparams.push(new filterparam("encounterid", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY _sequenceid desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }
  receiveMonitoringFrequencyData(event) {
    this.monitoringFrequencyData = event;
    console.log('Received data from child:', event);
    let fres = parseInt(this.monitoringFrequencyData.frequency_entered, 10);
    this.monitoringFrequencyData.frequency_entered = isNaN(fres) || +fres == 0 ? "null" : fres.toString();

    this.monitoringFrequencyData.monitoringnotrequired = event.isstop

  }
  patientrefuseChange() {
    if (!this.gcsobservations.patientrefused) {
      this.showpatientrefuselink = true;
    }
  }

  SaveObsevation() {
    this.showError = this.showerror1 = this.showerror2 = this.showerror3 = false
    this.showValidate7DayError = false;
    if ( !this.gcsobservations.patientrefused && !this.gcsobservations.eyesvalue && !this.gcsobservations.verbalvalue && !this.gcsobservations.motorvalue &&  !this.appService.AuthoriseAction('eobs_set_frequency_Glasgow_Coma_Scale')) {
        this.showerror1 = this.showerror2 = this.showerror3  = true; return;
    }
    if (  !this.gcsobservations.patientrefused && !this.gcsobservations.eyesvalue && (this.gcsobservations.verbalvalue || this.gcsobservations.motorvalue)) {
      this.showerror1 = true; return;
    }
    if ( !this.gcsobservations.patientrefused && !this.gcsobservations.verbalvalue && (this.gcsobservations.eyesvalue || this.gcsobservations.motorvalue)) {
      this.showerror2 = true; return;
    }
    if (  !this.gcsobservations.patientrefused && !this.gcsobservations.motorvalue && (this.gcsobservations.verbalvalue || this.gcsobservations.eyesvalue)) {
      this.showerror3 = true; return;
    }

    if (this.gcsobservations.patientrefused && this.gcsobservations.frequencyentered) {
      this.showError = true;
      this.showErrormessage = "Please Enter Patient Refuse Reason"
      return;
    }

    if (this.gcsobservations.patientrefused && !this.gcsobservations.reasonforpatientrefused) {
      this.showError = true;
      this.showErrormessage = "Please Enter Patient Refuse Reason"
      return;
    }
    if ( ( isNaN(this.monitoringFrequencyData.monitoringFrequency ) || this.monitoringFrequencyData.monitoringFrequency == 0 || this.monitoringFrequencyData.frequency_entered == "null"  || this.monitoringFrequencyData.frequency_entered == null) && !this.monitoringFrequencyData.monitoringnotrequired) {
      this.showError = true;
      this.showErrormessage = "Please Enter Monitoring Frequency"
      return;
    }
    else {
      let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
      if (validateTo7Days) {
        this.showValidate7DayError = true;
        return;
      }
    }
    if ((this.monitoringFrequencyData.frequencyunit_entered == 'null' || this.monitoringFrequencyData.frequencyunit_entered == null) && !this.monitoringFrequencyData.monitoringnotrequired) {
      this.showError = true;
      this.showErrormessage = "Please Enter Monitoring Frequency Unit"
      return;
    }
    if (this.monitoringFrequencyData.frequency_reason == 'null') {
      this.showError = true;
      this.showErrormessage = "Please Enter Monitoring Frequency Reason"
      return;
    }
    else {
      if (this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
        this.showError = true;
        this.showErrormessage = "Please Enter Monitoring Frequency Reason"
        return;
      }
    }


    let loggedInUser = this.appService.loggedInUserName

    this.gcsobservations.personid = this.appService.personId
    this.gcsobservations.encounterid = this.encounterId
    this.gcsobservations.gcsobservations_id = uuidv4()
    this.gcsobservations.observationtime = this.getDateTime(this.Choosenfilterdate)
    this.gcsobservations.submittedtime = this.getDateTime();


    this.gcsobservations.completedby = loggedInUser;

    if (this.monitoringFrequencyData.monitoringnotrequired) {
      this.gcsobservations.monitoringnotrequired = true;
      this.gcsobservations.frequencyinhour = null
      this.gcsobservations.frequencyentered = null
      this.gcsobservations.frequencyunit = null
      this.gcsobservations.monitoringreason = this.monitoringFrequencyData.frequency_reason
      if (this.monitoringFrequencyData.frequency_reason == "Other") {
        this.gcsobservations.monitoringreasonother = this.monitoringFrequencyData.frequency_reason_other
      }

    }
    else {
      this.gcsobservations.monitoringnotrequired = false;
      this.gcsobservations.frequencyinhour = this.monitoringFrequencyData.monitoringFrequency
      this.gcsobservations.frequencyentered = this.monitoringFrequencyData.frequency_entered
      this.gcsobservations.frequencyunit = this.monitoringFrequencyData.frequencyunit_entered
      this.gcsobservations.monitoringreason = this.monitoringFrequencyData.frequency_reason
      if (this.monitoringFrequencyData.frequency_reason == "Other") {
        this.gcsobservations.monitoringreasonother = this.monitoringFrequencyData.frequency_reason_other
      }

    }
    if (this.gcsobservations.patientrefused) {
      this.gcsobservations.eyes = null;
      this.gcsobservations.eyesvalue = null;
      this.gcsobservations.verbal = null;
      this.gcsobservations.verbalvalue = null;
      this.gcsobservations.motor = null;
      this.gcsobservations.motorvalue = null;
      this.gcsobservations.pupilrightsize = null;
      this.gcsobservations.pupilrightreaction = null;
      this.gcsobservations.pupilleftsize = null;
      this.gcsobservations.pupilleftreaction = null;
      this.gcsobservations.limbleftarm = null;
      this.gcsobservations.limbrightarm = null;
      this.gcsobservations.limbleftleg = null;
      this.gcsobservations.limbrightleg = null;


    } else {
      this.gcsobservations.totalscore = Number(this.gcsobservations.eyesvalue) + Number(this.gcsobservations.verbalvalue) + Number(this.gcsobservations.motorvalue);
      this.gcsobservations.totalscore = this.gcsobservations.totalscore == 0 ? null : this.gcsobservations.totalscore
      this.gcsobservations.eyes = eyesValue[this.gcsobservations.eyesvalue + "N"];
      this.gcsobservations.verbal = verbalvalue[this.gcsobservations.verbalvalue + "N"];
      this.gcsobservations.motor = motorvalue[this.gcsobservations.motorvalue + "N"];
      this.gcsobservations.reasonforpatientrefused = null;
    }
    if (this.gcsobservations.eyesvalue && this.gcsobservations.verbalvalue && this.gcsobservations.motorvalue && this.gcsobservations.pupilrightsize && this.gcsobservations.pupilleftsize
      && this.gcsobservations.pupilrightreaction && this.gcsobservations.pupilleftreaction && this.gcsobservations.limbleftarm && this.gcsobservations.limbleftleg && this.gcsobservations.limbrightarm && this.gcsobservations.limbrightleg) {
      this.gcsobservations.ispartial = false
    }
    else {
      this.gcsobservations.ispartial = true
    }

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    upsertManager.addEntity('core', 'gcsobservations', JSON.parse(JSON.stringify(this.gcsobservations)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.messageSuccess = true;
      this.init()
      this.gcsobservations = new Gcsobservations();
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BloodGlucose)
      setTimeout(() => {                           // <<<---using ()=> syntax
        this.messageSuccess = false;
        this.OthereReason = ""
      }, 2000);

    },
      (error) => {
        this.messageSuccess = false;
        this.showError = true;
        this.showErrormessage = error
        console.log(error)

      }
    );





  }

  saveEditorDelete(action) {
    this.editshowError = false;
    this.showEditValidate7DayError = false;
    let loggedInUser = this.appService.loggedInUserName
    if (action == "Delete" && this.selectedgcsobservations.reasonforamend == "Other" && (this.selectedgcsobservations.reasonforamendother == null || this.selectedgcsobservations.reasonforamendother.trim() == "")) {
      this.editshowError = true;
      this.EditshowErrormessage = "Please Enter Other Reason."
      return;
    }
    if (action != "Delete") {
      if (!this.selectedgcsobservations.patientrefused) {
        if (!this.selectedgcsobservations.eyesvalue && !this.selectedgcsobservations.verbalvalue && !this.selectedgcsobservations.motorvalue &&  !this.appService.AuthoriseAction('eobs_set_frequency_Glasgow_Coma_Scale')) {
          this.editshowError = true;
          this.EditshowErrormessage = "Please answer all 3 GCS questions."
          return;
        }
        if (!this.selectedgcsobservations.verbalvalue && (this.selectedgcsobservations.eyesvalue || this.selectedgcsobservations.motorvalue)) {
          this.editshowError = true;
          this.EditshowErrormessage = "Please answer all 3 GCS questions."
          return;
        }
        if (!this.selectedgcsobservations.motorvalue && (this.selectedgcsobservations.verbalvalue || this.selectedgcsobservations.eyesvalue)) {
          this.editshowError = true;
          this.EditshowErrormessage = "Please answer all 3 GCS questions."
          return;
        }
      }
      // ---------------------------------
      if (!this.selectedgcsobservations.patientrefused && this.selectedgcsobservations.reasonforamend == "Other" && (this.selectedgcsobservations.reasonforamendother == null || this.selectedgcsobservations.reasonforamendother.trim() == "")) {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Other Reason."
        return;
      }
      if (this.selectedgcsobservations.patientrefused && (this.selectedgcsobservations.reasonforpatientrefused == null || this.selectedgcsobservations.reasonforpatientrefused.trim() == "")) {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Patient Refuse Reason."
        return;
      }
      if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_entered == "null" && !this.monitoringFrequencyData.monitoringnotrequired) {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Monitoring Frequency"
        return;
      }
      if (this.LatestRecordSelected && !this.monitoringFrequencyData.monitoringnotrequired && (this.monitoringFrequencyData.frequencyunit_entered == 'null' || this.monitoringFrequencyData.frequencyunit_entered == null)) {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Monitoring Frequency Unit"
        return;
      }
      if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'null') {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Monitoring Frequency Reason"
        return;
      }

      if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Monitoring Frequency Reason"
        return;
      }

      else {
        let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
        if (validateTo7Days) {
          this.showEditValidate7DayError = true;
          return;
        }
      }
      if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'null') {
        this.editshowError = true;
        this.EditshowErrormessage = "Please Enter Monitoring Frequency Reason."
        return;
      }
      else {
        if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'Other' && (this.monitoringFrequencyData.frequency_reason_other == null || this.monitoringFrequencyData.frequency_reason_other.trim() == "")) {
          this.editshowError = true;
          this.EditshowErrormessage = "Please Enter Monitoring Frequency Reason."
          return;
        }
      }

      if (this.LatestRecordSelected) {
        if (this.monitoringFrequencyData.monitoringnotrequired) {
          this.selectedgcsobservations.monitoringnotrequired = true;
          this.selectedgcsobservations.frequencyinhour = null
          this.selectedgcsobservations.frequencyentered = null
          this.selectedgcsobservations.frequencyunit = null
          this.selectedgcsobservations.monitoringreason = this.monitoringFrequencyData.frequency_reason
          if (this.monitoringFrequencyData.frequency_reason == "Other") {
            this.selectedgcsobservations.monitoringreasonother = this.monitoringFrequencyData.frequency_reason_other
          }

        }
        else {
          this.selectedgcsobservations.monitoringnotrequired = false;
          this.selectedgcsobservations.frequencyinhour = this.monitoringFrequencyData.monitoringFrequency
          this.selectedgcsobservations.frequencyentered = this.monitoringFrequencyData.frequency_entered
          this.selectedgcsobservations.frequencyunit = this.monitoringFrequencyData.frequencyunit_entered
          this.selectedgcsobservations.monitoringreason = this.monitoringFrequencyData.frequency_reason
          if (this.monitoringFrequencyData.frequency_reason == "Other") {
            this.selectedgcsobservations.monitoringreasonother = this.monitoringFrequencyData.frequency_reason_other
          }

        }
      }

      if (this.selectedgcsobservations.patientrefused) {
        this.selectedgcsobservations.eyes = null;
        this.selectedgcsobservations.eyesvalue = null;
        this.selectedgcsobservations.verbal = null;
        this.selectedgcsobservations.verbalvalue = null;
        this.selectedgcsobservations.motor = null;
        this.selectedgcsobservations.motorvalue = null;
        this.selectedgcsobservations.pupilrightsize = null;
        this.selectedgcsobservations.pupilrightreaction = null;
        this.selectedgcsobservations.pupilleftsize = null;
        this.selectedgcsobservations.pupilleftreaction = null;
        this.selectedgcsobservations.limbleftarm = null;
        this.selectedgcsobservations.limbrightarm = null;
        this.selectedgcsobservations.limbleftleg = null;
        this.selectedgcsobservations.limbrightleg = null;


      } else {
        this.selectedgcsobservations.totalscore = Number(this.selectedgcsobservations.eyesvalue) + Number(this.selectedgcsobservations.verbalvalue) + Number(this.selectedgcsobservations.motorvalue);
        this.selectedgcsobservations.totalscore =  this.selectedgcsobservations.totalscore == 0 ? null : this.selectedgcsobservations.totalscore
        this.selectedgcsobservations.eyes = eyesValue[this.selectedgcsobservations.eyesvalue + "N"];
        this.selectedgcsobservations.verbal = verbalvalue[this.selectedgcsobservations.verbalvalue + "N"];
        this.selectedgcsobservations.motor = motorvalue[this.selectedgcsobservations.motorvalue + "N"];
        this.selectedgcsobservations.reasonforpatientrefused = null;
        if (this.selectedgcsobservations.eyesvalue && this.selectedgcsobservations.verbalvalue && this.selectedgcsobservations.motorvalue && this.selectedgcsobservations.pupilrightsize && this.selectedgcsobservations.pupilleftsize
          && this.selectedgcsobservations.pupilrightreaction && this.selectedgcsobservations.pupilleftreaction && this.selectedgcsobservations.limbleftarm && this.selectedgcsobservations.limbleftleg && this.selectedgcsobservations.limbrightarm && this.selectedgcsobservations.limbrightleg) {
          this.selectedgcsobservations.ispartial = false
        }
        else {
          this.selectedgcsobservations.ispartial = true
        }
      }
    }
    else {
      let Record = this.GCSDetails.find(x => x.gcsobservations_id == this.selectedgcsobservations.gcsobservations_id)

      Record.isdeleted = true;
      Record.deletedby = loggedInUser;
      Record.reasonforamend = this.selectedgcsobservations.reasonforamend
      Record.reasonforamendother = this.selectedgcsobservations.reasonforamendother
      this.selectedgcsobservations = JSON.parse(JSON.stringify(Record));
    }

    this.selectedgcsobservations.submittedtime = this.getDateTime();
    this.selectedgcsobservations.isamended = true;
    this.selectedgcsobservations.completedby = loggedInUser;
    Object.keys(this.selectedgcsobservations).map((e) => { if (e.startsWith("_")) delete this.selectedgcsobservations[e]; })
    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    upsertManager.addEntity('core', 'gcsobservations', JSON.parse(JSON.stringify(this.selectedgcsobservations)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.init()
      this.gcsobservations = new Gcsobservations();
      this.selectedgcsobservations = null
      this.showDelete = false
      this.OthereReason = ""
      this.showEdit = false
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.GlasgowComaScale)


    },
      (error) => {

        console.log(error)

      }
    );



  }

  getDateTime(date = new Date()): string {


    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let day = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();

    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day) +
      "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));

    return returndate;
  }



  receivehistoryViewerData(data: any, clickedAction: string) {
    if (clickedAction == "showHistory") {
      let Record = this.GCSDetails.find(x => x.gcsobservations_id == data.gcsobservations_id)
      this.selectedgcsobservations = JSON.parse(JSON.stringify(Record));
      this.RecordHistory = this.selectedgcsobservations.__history;
      this.RecordHistory.sort((a, b) => new Date(b._createddate).getTime() - new Date(a._createddate).getTime());
      this.showEditHistory = true;
    }
    else {
      let Record = this.GCSDetails.find(x => x.gcsobservations_id == data.gcsobservations_id)
      if (Record.gcsobservations_id == this.GCSDetails[0].gcsobservations_id) {
        this.LatestRecordSelected = true

        // this.defaultMonitoringFrequencyData = {
        //   'frequency_entered': null,
        //   'frequencyunit_entered': null,
        //   'isstop':Record.__observationeventmonitoring.isstop,
        //   'ispause':Record.__observationeventmonitoring.ispause,
        //   'monitoringnotrequired': Record.__observationeventmonitoring.monitoringnotrequired,
        //   "frequency_reason":Record.__observationeventmonitoring.frequency_reason,
        //   "frequency_reason_other":Record.__observationeventmonitoring.frequency_reason_other
        // }
        if (Record.monitoringnotrequired) {
          this.defaultMonitoringFrequencyData = {
            'frequency_entered': null,
            'frequencyunit_entered': null,
            'monitoringnotrequired': true,
            'isstop': true,
            "frequency_reason": Record.monitoringreason,
            "frequency_reason_other": Record.monitoringreasonother
          }
        }
        else {

          this.defaultMonitoringFrequencyData = {
            'frequency_entered': Record.frequencyentered,
            'frequencyunit_entered': Record.frequencyunit,
            'monitoringnotrequired': false,
            'isstop': false,
            "frequency_reason": Record.monitoringreason,
            "frequency_reason_other": Record.monitoringreasonother

          }
        }
      }
      else {
        this.LatestRecordSelected = false;

      }
      this.selectedgcsobservations = JSON.parse(JSON.stringify(Record));
      this.selectedgcsobservations.reasonforamend = "Entered in error";
      this.editshowError = false;
      this.showEditValidate7DayError = false;
      this.showEdit = true;
    }
  }


  loadChart() {
    const items = [];
    const itemseyes = [];
    const itemsVerbal = [];
    const itemsMotot = [];
    this.GCSDetails.forEach(element => {
      items.push({ x: moment(element.observationtime).toDate(), y: element.totalscore, label: { content: element.totalscore } })
      if (element.eyesvalue)
        itemseyes.push({ x: moment(element.observationtime).toDate(), y: element.eyesvalue, label: { content: element.eyesvalue } })
      if (element.verbalvalue)
        itemsVerbal.push({ x: moment(element.observationtime).toDate(), y: element.verbalvalue, label: { content: element.verbalvalue } })
      if (element.motorvalue)
        itemsMotot.push({ x: moment(element.observationtime).toDate(), y: element.motorvalue, label: { content: element.motorvalue } })
    });

    // Configuration for the Graph2d
    const options: Graph2dOptions = {
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Total Score'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };
    const optionsEyes: Graph2dOptions = {
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Eyes'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };

    const optionsverbal: Graph2dOptions = {
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Verbal'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };

    const optionsmotot: Graph2dOptions = {
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Motor'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };
    var visualization = document.getElementById("visualization");
    var visualizationEyes = document.getElementById("visualizationEyes");
    var visualizationVerbal = document.getElementById("visualizationVerbal");
    var visualizationMotot = document.getElementById("visualizationMotot");
    if (visualization) {
      visualization.innerHTML = ""
      visualizationEyes.innerHTML = ""
      visualizationVerbal.innerHTML = ""
      visualizationMotot.innerHTML = ""

      // Create a Graph2d visualizationVerbal  visualizationMotot
      this.graph2d = new Graph2d(visualization, items, options);
      this.graph2dEyes = new Graph2d(visualizationEyes, itemseyes, optionsEyes);
      this.graph2dVerbal = new Graph2d(visualizationVerbal, itemsVerbal, optionsverbal);
      this.graph2dMotot = new Graph2d(visualizationMotot, itemsMotot, optionsmotot);
    }
  }
  DeleteCancelClick() {
    if (this.selectedgcsobservations.reasonforamend == "Recorded for the wrong patient") {
      this.selectedgcsobservations.reasonforamend = "Entered in error"
    }
    this.showDelete = false;
    this.showEdit = true;
  }
  zoomIn(): void {
    const range = this.graph2d.getWindow();
    const interval = range.end - range.start;
    this.graph2dVerbal.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dMotot.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dEyes.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2d.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });

  }

  zoomOut(): void {
    const range = this.graph2d.getWindow();
    const interval = range.end - range.start;
    this.graph2dVerbal.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dMotot.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dEyes.setWindow({
      start: moment(range.start).subtract(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).add(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2d.setWindow({
      start: moment(range.start).subtract(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).add(interval * 0.2, 'milliseconds').toDate()
    });
  }


  showReasonAlert(reason) {
    this.subject.showReasonModal.next(reason);
  }
}

export enum eyesValue {
  ["4N"] = "Spontaneous",
  ["3N"] = "To Sound",
  ["2N"] = "To Pressure",
  ["1N"] = "None",
  ["0N"] = "Not Testable",
}

export enum verbalvalue {
  ["5N"] = "Orientated",
  ["4N"] = "Confused",
  ["3N"] = "Words",
  ["2N"] = "Sounds",
  ["1N"] = "None",
  ["0N"] = "Not Testable",
}

export enum motorvalue {
  ["6N"] = "Obey Commands",
  ["5N"] = "Localising",
  ["4N"] = "Normal Flexion",
  ["3N"] = "Abnormal Flexion",
  ["2N"] = "Extension",
  ["1N"] = "None",
  ["0N"] = "Not Testable",
}


