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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
// import { HeaderService } from '../services';

import { ApirequestService } from '../services/apirequest.service';
import { Observation, Observationevent, ObservationEventMonitoring } from '../models/person.model';
import { SharedDataContainerService } from '../services/shared-data-container.service';
import { AuthenticationService } from '../services/authentication.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { UpsertTransactionManager } from '../services/upsert-transaction-manager.service';

import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Graph2d, Graph2dOptions } from 'vis-timeline/standalone';
import { AppService, BadgeNames } from '../services/app.service';
import { ChartComponent } from '../chart/chart.component';
import { SubjectsService } from '../services/subjects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blood-glucose',
  templateUrl: './blood-glucose.component.html',
  styleUrls: ['./blood-glucose.component.css']
})
export class BloodGlucoseComponent implements OnInit, OnDestroy {

  username: any;
  chartConfig: any;
  messageSuccess: boolean;
  subscriptions: Subscription = new Subscription();

  constructor(public subject: SubjectsService, public modalService: BsModalService, public bsGraphModalRef: BsModalRef, private apiRequest: ApirequestService, private sharedData: SharedDataContainerService, private authService: AuthenticationService, public appService: AppService) {
    this.chartConfig = { 'chartHeading': 'Blood Glucose Graph', 'UOM': 'mmol/L' }
    this.observationtype = {
      'observationtype': 'bloodglucosefrequency',
      'RBAC': this.appService.AuthoriseAction('eobs_set_frequency_blood_glucose')
    }
    // this.defaultMonitoringFrequencyData = {
    //   'frequency_entered': '12',
    //   'frequencyunit_entered': 'hours'
    // };
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;
    //  this.minTime.setHours(9, 0, 0); // Sets minTime to 9:00 AM

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.init();


    this.encounterId = this.appService.encounter.encounter_id

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }

  rowForHistoryViewer = [
    {
      'id': 'datestarted',
      'fieldName': 'Observation Time'
    },
    {
      'id': 'bloodglucose',
      'fieldName': 'mmol/L'
    },
    {
      'id': 'recorded',
      'fieldName': 'Recorded'
    },
    {
      'id': 'frequency_entered',
      'fieldName': 'Monitoring frequency'
    },
    {
      'id': 'reason',
      'fieldName': 'Reason'
    },
    {
      'id': 'createddate',
      'fieldName': 'Recorded Date/Time'
    },
    {
      'id': 'createdby',
      'fieldName': 'Recorded By'
    },
    {
      'id': 'reasonfee',
      'fieldName': 'Reason for Refusal'
    },
    {
      'id': 'action',
      'fieldName': ''
    },
  ]
  showError = false;
  showErrormessage = "";
  recordedError = false;
  monitoringFrequencyData: any;
  observationtype: any;
  showEdit = false;
  showDelete = false;
  ShowHistory = false;
  showEditHistory = false;
  selectedbloodGlucose: any;
  bloodGlucose: any;
  recordedAt = ""
  monitaringFrequency: any;
  monitaringFrequencyunit: string;
  encounterId = "";
  bloodGlucoseDetail: any;
  Obsevation: any;
  obsevationevent: any;
  posturalbloodpressureHistory: any

  Showchart = false

  RecordHistory: any;
  Choosenfilterdate = new Date();
  Choosenfiltertime: any;
  OthereReason = "";
  public today = new Date();
  public mindate = new Date();
  public maxTime = new Date();
  public minTime = new Date();
  defaultMonitoringFrequencyData: any;
  EditMonitoringFrequencyData: any;
  monitoringFrequencyHistoryData = [];
  LatestRecordSelected = false;
  ShowGraph: boolean = false;
  private graph2d: any;
  patientrefuse = false;
  showpatientrefuselink = true;
  reasonforRefusal = "";
  patientrefuseerror = false;
  editRecordError = "";
  showEditRecordError = false;
  ShowPlan = false;
  ShowPlanSection = "All"
  dataSaving = false;
  showValidate7DayError: boolean = false;
  showEditValidate7DayError: boolean = false;

  showeditdiscard = false
  showeModelditdiscard = false
  currentRecordedFrequencyAndReason: string = '';

  @ViewChild('visualization', { static: false }) visualization!: ElementRef;


  init() {
    this.Choosenfilterdate = new Date();
    this.mindate = new Date()
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;

    this.minTime.setMinutes(this.minTime.getMinutes(), 0, 0)

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)

    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/terminus_getbloodglucosedetails`, this.createFilter())
      .subscribe(
        (posturalbloodpressure) => {
          this.monitoringFrequencyHistoryData = [];

          this.bloodGlucoseDetail = posturalbloodpressure

          this.bloodGlucoseDetail.sort((b, a) => new Date(a.datestarted).getTime() - new Date(b.datestarted).getTime());

          for (let Obj of this.bloodGlucoseDetail) {
            if (!Obj.patientrefused) {
              Obj.__recorded = JSON.parse(Obj.__recorded)[0]


              Obj.__bloodglucose = JSON.parse(Obj.__bloodglucose)[0]
            }
            Obj.__observationeventmonitoring = JSON.parse(Obj.__observationeventmonitoring)[0]
            Obj.__history = JSON.parse(Obj.__history)


            this.monitoringFrequencyHistoryData.push(
              {
                'datestarted': moment(Obj.datestarted), 'bloodglucose': Obj.patientrefused == true ? "" : Obj.__bloodglucose.value,
                'value': Obj.patientrefused == true ? "" : Obj.__bloodglucose.value,
                'recorded': Obj.patientrefused == true ? "Patient Refused" : Obj.__recorded.value,
                'frequency_entered': Obj.__observationeventmonitoring.isstop ? "Monitoring Stopped" : (Obj.__observationeventmonitoring.frequency_entered + ' ' + Obj.__observationeventmonitoring.frequencyunit_entered),

                'createddate': moment(Obj._createddate).format('DD-MM-yyyy HH:mm'),
                'createdby': Obj.addedby,
                'action': '',
                'observationevent_id': Obj.observationevent_id,
                'eventcorrelationid': Obj.eventcorrelationid,
                'isamended': Obj.isamended,
                'isdeleted': Obj.isdeleted,
                'reasonfee': Obj.reasonforpatientrefused,
                'reason': Obj.__observationeventmonitoring.frequency_reason == "Other" ? Obj.__observationeventmonitoring.frequency_reason_other : Obj.__observationeventmonitoring.frequency_reason,
                'clickedAction': '',
                'showEdit': this.appService.AuthoriseAction('eobs_edit_blood_glucose'),
                'showHistory': true,
                'componentCalled': 'blood_glucose'
              })
          }
          if (this.bloodGlucoseDetail.length > 0) {
            if (!this.bloodGlucoseDetail[0].__observationeventmonitoring.isstop) {
              this.currentRecordedFrequencyAndReason = '- every ' + this.monitoringFrequencyHistoryData[0].frequency_entered + ' - ' + this.monitoringFrequencyHistoryData[0].reason;
            }
            else {
              this.currentRecordedFrequencyAndReason = '';
            }

            this.defaultMonitoringFrequencyData = null
            this.defaultMonitoringFrequencyData = {
              'frequency_entered': this.bloodGlucoseDetail[0].__observationeventmonitoring.frequency_entered,
              'frequencyunit_entered': this.bloodGlucoseDetail[0].__observationeventmonitoring.frequencyunit_entered,
              'isstop': this.bloodGlucoseDetail[0].__observationeventmonitoring.isstop,
              'ispause': this.bloodGlucoseDetail[0].__observationeventmonitoring.ispause,
              'monitoringnotrequired': this.bloodGlucoseDetail[0].__observationeventmonitoring.monitoringnotrequired,
              "frequency_reason": this.bloodGlucoseDetail[0].__observationeventmonitoring.frequency_reason,
              "frequency_reason_other": this.bloodGlucoseDetail[0].__observationeventmonitoring.frequency_reason_other
            }

          }
          else {
            this.defaultMonitoringFrequencyData = {

              'isstop': true,
              "frequency_reason": "Other",
              "frequency_reason_other": "Monitoring not started"

            }
          }
          // this.loadChart();
        },

      )
    )
  }

  ngOnInit(): void {

    this.username = this.appService.loggedInUserName
  }

  DeleteCancelClick() {
    if (this.selectedbloodGlucose.reasonforamend == "Recorded for the wrong patient") {
      this.selectedbloodGlucose.reasonforamend = "Entered in error"
    }
    this.showDelete = false;
    this.showEdit = true;
  }

  inputCheck(event, form) {
    let weight = event.target.value.toString().replace(/[^0-9.]/g, '');

    let [leftDigits, rightDigits] = weight.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 2) {
      newLeftDigit = leftDigits.slice(0, 2);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedWeight = newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : (weight[weight.length - 1] == "." ? "." : ''));
    if (+updatedWeight < 1 || isNaN(+updatedWeight)) {
      updatedWeight = undefined;
    }
    setTimeout(() => {
      if (form == "edit") {
        this.selectedbloodGlucose.__bloodglucose.value = updatedWeight;

      }
      else {
        this.bloodGlucose = updatedWeight;
      }

    }, 0);

  }

  TrimTrailingDots(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\.+$/, ''); // Remove trailing dots
  }


  SaveObsevation() {
    this.showError = false;

    this.showErrormessage = "";
    this.recordedError = false;
    this.patientrefuseerror = false;
    this.showValidate7DayError = false;
    if (this.patientrefuse && this.reasonforRefusal.trim() == "") {
      this.patientrefuseerror = true;
      return;
    }
    if (!this.patientrefuse && !this.bloodGlucose && !this.appService.AuthoriseAction('eobs_set_frequency_blood_glucose')) {
      this.showError = true;
      this.showErrormessage = "Please enter Blood Glucose"
      return;
    }
    if (!this.patientrefuse && this.bloodGlucose && this.recordedAt == "") {
      this.recordedError = true;
      return;
    }
    if ((isNaN(this.monitoringFrequencyData.monitoringFrequency) || this.monitoringFrequencyData.monitoringFrequency == 0 || this.monitoringFrequencyData.frequency_entered == "null" || this.monitoringFrequencyData.frequency_entered == null) && !this.monitoringFrequencyData.isstop) {
      this.showError = true;
      this.showErrormessage = "Please enter Monitoring Frequency"
      return;
    }
    if ((this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == "null") && !this.monitoringFrequencyData.isstop) {
      this.showError = true;
      this.showErrormessage = "Please enter Monitoring Frequency Unit"
      return;
    }
    else {
      let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
      if (validateTo7Days) {
        this.showValidate7DayError = true;
        return;
      }
    }
    if (this.monitoringFrequencyData.frequency_reason == 'null') {
      this.showError = true;
      this.showErrormessage = "Please enter Monitoring Frequency Reason"
      return;
    }
    else {
      if (this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
        this.showError = true;
        this.showErrormessage = "Please enter Other Reason"
        return;
      }
    }

    this.messageSuccess = true;
    let eventcorrelationid = uuidv4();
    let loggedInUser = this.appService.loggedInUserName

    let ObsbloodGlucose = null
    let ObsrecordedAt = null
    let newObsEvent = this.createObservationEvent(eventcorrelationid, "5bbd8361-5252-4670-a914-a89122e9aa8e");

    let value = this.bloodGlucose ? (+this.bloodGlucose).toString() : ""
    let recorded = this.recordedAt ? this.recordedAt.toString() : ""
    if (value) {
      this.ShowPlan=true;
      if (+value >= 4) {
        this.ShowPlanSection = "first"
      }
      else if (+value >= 3) {
        this.ShowPlanSection = "second"
      }
      else if (+value >= 2) {
        this.ShowPlanSection = "third"
      }
      else if (+value <= 2) {
        this.ShowPlanSection = "fourth"
      }
    }
   
    if (!this.patientrefuse) {


      ObsbloodGlucose = this.createObsevation(newObsEvent, eventcorrelationid, "d8c07866-6c4a-468d-b832-47427fe4a805", value)

      ObsrecordedAt = this.createObsevation(newObsEvent, eventcorrelationid, "7e9e64d7-0f87-44b9-8535-8b0c13613910", recorded)

    }


    let EventMonitoring = new ObservationEventMonitoring(uuidv4(), newObsEvent.observationevent_id, this.monitoringFrequencyData.monitoringFrequency, null, "false", "false", "null", "null", null, null, eventcorrelationid,
      false, false, false, this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered, this.monitoringFrequencyData.frequency_reason, this.monitoringFrequencyData.frequency_reason_other
      , this.monitoringFrequencyData.ispause, this.monitoringFrequencyData.isstop, this.monitoringFrequencyData.isnews2suggestestedfreq, this.monitoringFrequencyData.observationtype_id, this.monitoringFrequencyData.observationtypetext, false, null, null, this.monitoringFrequencyData.monitoringnotrequired)

    newObsEvent.observationfrequency = EventMonitoring.observationfrequency

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    upsertManager.addEntity('core', 'observationevent', JSON.parse(JSON.stringify(newObsEvent)));

    if (!this.patientrefuse) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObsbloodGlucose)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObsrecordedAt)));
    }



    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.init()
      this.ShowHistory = false;
      this.patientrefuse = false
      this.reasonforRefusal = ""
      this.OthereReason = ""
      this.bloodGlucose = null;
      this.recordedAt = ""
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BloodGlucose)
      this.dataSaving = false;

      setTimeout(() => {                           // <<<---using ()=> syntax
        this.messageSuccess = false;
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
  patientrefuseChange() {
    if (!this.patientrefuse) {
      this.showpatientrefuselink = true;
    }
  }
  createObsevation(Observationevent: Observationevent, eventcorrelationid: any, observationtype_id: string, value = "") {

    let loggedInUser = this.username = this.appService.loggedInUserName


    return new Observation(
      uuidv4(), "", "", Observationevent.datefinished,
      Observationevent.observationevent_id, observationtype_id,
      "", value.toString(), false, loggedInUser, eventcorrelationid, null);
  }

  createObservationEvent(eventcorrelationid: any, eventType: string) {

    let personrefuse = null;
    let refuseresion = null;
    if (this.patientrefuse) {
      personrefuse = this.patientrefuse
      refuseresion = this.reasonforRefusal
    }

    let loggedInUser = this.username = this.appService.loggedInUserName

    return new Observationevent(
      uuidv4(), this.appService.personId, this.getDateTime(this.Choosenfilterdate), this.getDateTime(this.Choosenfilterdate), loggedInUser,
      this.encounterId, false, 168, "", null, null, loggedInUser, null, null, null, null, null, eventType, eventcorrelationid, null, null, null, 'bloodglucosefrequency', null, personrefuse, refuseresion);
  }
  receivehistoryViewerData(data) {
    if (data.clickedAction == "showHistory") {
      let Record = this.bloodGlucoseDetail.find(x => x.observationevent_id == data.observationevent_id)
      this.selectedbloodGlucose = JSON.parse(JSON.stringify(Record));
      this.RecordHistory = this.selectedbloodGlucose.__history;
      this.RecordHistory.sort((a, b) => new Date(b._createddate).getTime() - new Date(a._createddate).getTime());
      this.showEditHistory = true;
    }
    else {
      let Record = this.bloodGlucoseDetail.find(x => x.observationevent_id == data.observationevent_id)
      if (Record.observationevent_id == this.bloodGlucoseDetail[0].observationevent_id) {
        this.LatestRecordSelected = true


        this.defaultMonitoringFrequencyData = {
          'frequency_entered': Record.__observationeventmonitoring.frequency_entered,
          'frequencyunit_entered': Record.__observationeventmonitoring.frequencyunit_entered,
          'isstop': Record.__observationeventmonitoring.isstop,
          'ispause': Record.__observationeventmonitoring.ispause,
          'monitoringnotrequired': Record.__observationeventmonitoring.monitoringnotrequired,
          "frequency_reason": Record.__observationeventmonitoring.frequency_reason,
          "frequency_reason_other": Record.__observationeventmonitoring.frequency_reason_other
        }


      }
      else {
        this.LatestRecordSelected = false;
      }
      if (Record.patientrefused) {
        Record.__bloodglucose = JSON.parse(JSON.stringify(this.createObsevation(Record, Record.eventcorrelationid, "d8c07866-6c4a-468d-b832-47427fe4a805", "")));

        Record.__recorded = JSON.parse(JSON.stringify(this.createObsevation(Record, Record.eventcorrelationid, "7e9e64d7-0f87-44b9-8535-8b0c13613910", "")));
      }

      this.selectedbloodGlucose = JSON.parse(JSON.stringify(Record));
      this.selectedbloodGlucose.reasonforamend = "Entered in error";
      this.showEditRecordError = false;
      this.showEditValidate7DayError = false;
      this.showEdit = true;
    }
  }
  // EditRecord(Record: any) {

  //   this.selectedbloodGlucose = JSON.parse(JSON.stringify(Record));
  //   this.selectedbloodGlucose.reasonforamend = "Entered in error";
  //   this.showEdit = true;
  // }

  saveEditorDelete(action: string) {

    this.showEditRecordError = false;
    this.showEditValidate7DayError = false;
    if (action == "Delete" && this.selectedbloodGlucose.reasonforamend == "Other" && this.OthereReason.trim() == "") {
      this.showEditRecordError = true;
      this.editRecordError = "Please enter Other Reason."
      return;
    }
    if (action != "Delete") {
      if (this.selectedbloodGlucose.patientrefused && this.selectedbloodGlucose.reasonforpatientrefused.trim() == "") {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Patient Refuse Reason."
        return;
      }
      if (!this.selectedbloodGlucose.patientrefused && this.selectedbloodGlucose.reasonforamend == "Other" && this.OthereReason.trim() == "") {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Other Reason."
        return;
      }
      if (!this.selectedbloodGlucose.patientrefused && !this.selectedbloodGlucose.__bloodglucose.value && !this.appService.AuthoriseAction('eobs_set_frequency_blood_glucose')) {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Blood Glucose."
        return;
      }
      if (!this.selectedbloodGlucose.patientrefused && this.selectedbloodGlucose.__bloodglucose.value && this.selectedbloodGlucose.__recorded.value.trim() == "") {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Recorded."
        return;
      }
      if (this.LatestRecordSelected && (isNaN(this.monitoringFrequencyData.monitoringFrequency) || this.monitoringFrequencyData.monitoringFrequency == 0 || this.monitoringFrequencyData.frequency_entered == "null" || this.monitoringFrequencyData.frequency_entered == null) && !this.monitoringFrequencyData.isstop) {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Monitoring Frequency."
        return;
      }

      if (this.LatestRecordSelected && !this.monitoringFrequencyData.isstop && (this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == "null")) {
        this.showEditRecordError = true;
        this.editRecordError = "Please Enter Monitoring Frequency Unit"
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
        this.showEditRecordError = true;
        this.editRecordError = "Please Enter Monitoring Frequency Reason."
        return;
      }
      else {
        if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
          this.showEditRecordError = true;
          this.editRecordError = "Please Enter Frequency Reason."
          return;
        }
      }
    }

    let loggedInUser = this.appService.loggedInUserName
    if (this.selectedbloodGlucose.reasonforamend == "Other") {
      this.selectedbloodGlucose.reasonforamendother = this.OthereReason;
    }

    let eventcorrelationid = uuidv4();

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let newObsEvent = JSON.parse(JSON.stringify(this.selectedbloodGlucose));
    newObsEvent.eventcorrelationid = eventcorrelationid
    newObsEvent.isamended = true;
    newObsEvent.addedby = loggedInUser





    // ---------------------------------------------------
    let ObsBloodGlucose = this.selectedbloodGlucose.__bloodglucose
    ObsBloodGlucose.value = +ObsBloodGlucose.value;
    ObsBloodGlucose.eventcorrelationid = eventcorrelationid
    Object.keys(ObsBloodGlucose).map((e) => { if (e.startsWith("_")) delete ObsBloodGlucose[e]; })

    ObsBloodGlucose._createdby = loggedInUser
    if (!newObsEvent.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObsBloodGlucose)));
    }
    // ---------------------------------------------------
    let Obsrecorded = this.selectedbloodGlucose.__recorded

    Obsrecorded.eventcorrelationid = eventcorrelationid
    Object.keys(Obsrecorded).map((e) => { if (e.startsWith("_")) delete Obsrecorded[e]; })
    Obsrecorded._createdby = loggedInUser

    if (!newObsEvent.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsrecorded)));
      newObsEvent.reasonforpatientrefused = ""
    }

    // ---------------------------------------------------
    let EventMonitoring = this.selectedbloodGlucose.__observationeventmonitoring
    EventMonitoring.eventcorrelationid = eventcorrelationid
    if (this.LatestRecordSelected) {
      EventMonitoring = new ObservationEventMonitoring(EventMonitoring.observationeventmonitoring_id, newObsEvent.observationevent_id, this.monitoringFrequencyData.monitoringFrequency, null, "false", "false", "null", "null", null, null, eventcorrelationid,
        false, false, false, this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered, this.monitoringFrequencyData.frequency_reason, this.monitoringFrequencyData.frequency_reason_other
        , this.monitoringFrequencyData.ispause, this.monitoringFrequencyData.isstop, this.monitoringFrequencyData.isnews2suggestestedfreq, this.monitoringFrequencyData.observationtype_id, this.monitoringFrequencyData.observationtypetext, false, null, null, this.monitoringFrequencyData.monitoringnotrequired)
    }
    // ---------------------------------------------------




    //--------------------
    Object.keys(EventMonitoring).map((e) => { if (e.startsWith("_")) delete EventMonitoring[e]; })
    newObsEvent.observationfrequency = EventMonitoring.observationfrequency
    Object.keys(newObsEvent).map((e) => { if (e.startsWith("_")) delete newObsEvent[e]; })


    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEvent)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.selectedbloodGlucose = null;
      this.showEdit = false;
      this.showDelete = false;
      this.OthereReason = ""
      this.LatestRecordSelected = false

      this.init();
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BloodGlucose)
    },
      (error) => {
        this.OthereReason = ""
        console.log(error)

      }
    );

  }

  deleteobservation(action: string) {
    this.showEditRecordError = false;
    if (action == "Delete" && this.selectedbloodGlucose.reasonforamend == "Other" && this.OthereReason.trim() == "") {
      this.showEditRecordError = true;
      this.editRecordError = "Please Enter Other Reason."
      return;
    }

    let loggedInUser = this.appService.loggedInUserName
    let Record = this.bloodGlucoseDetail.find(x => x.observationevent_id == this.selectedbloodGlucose.observationevent_id)
    Record.reasonforamend = this.selectedbloodGlucose.reasonforamend
    this.selectedbloodGlucose = JSON.parse(JSON.stringify(Record));

    if (this.selectedbloodGlucose.reasonforamend == "Other") {
      this.selectedbloodGlucose.reasonforamendother = this.OthereReason;
    }
    let eventcorrelationid = uuidv4();

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let newObsEvent = JSON.parse(JSON.stringify(this.selectedbloodGlucose));
    newObsEvent.eventcorrelationid = eventcorrelationid
    newObsEvent.isamended = true;
    newObsEvent.addedby = loggedInUser



    newObsEvent.isdeleted = true;
    newObsEvent.deletedby = loggedInUser
    newObsEvent.reasonfordelete = this.selectedbloodGlucose.reasonforamend
    newObsEvent.deletedreasonothertext = this.OthereReason;




    // ---------------------------------------------------
    let ObsBloodGlucose = this.selectedbloodGlucose.__bloodglucose

    ObsBloodGlucose.eventcorrelationid = eventcorrelationid
    Object.keys(ObsBloodGlucose).map((e) => { if (e.startsWith("_")) delete ObsBloodGlucose[e]; })

    ObsBloodGlucose._createdby = loggedInUser
    if (!newObsEvent.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObsBloodGlucose)));
    }
    // ---------------------------------------------------
    let Obsrecorded = this.selectedbloodGlucose.__recorded

    Obsrecorded.eventcorrelationid = eventcorrelationid
    Object.keys(Obsrecorded).map((e) => { if (e.startsWith("_")) delete Obsrecorded[e]; })
    Obsrecorded._createdby = loggedInUser

    if (!newObsEvent.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsrecorded)));
      newObsEvent.reasonforpatientrefused = ""
    }

    // ---------------------------------------------------
    let EventMonitoring = this.selectedbloodGlucose.__observationeventmonitoring
    EventMonitoring.eventcorrelationid = eventcorrelationid
    EventMonitoring.isdeleted = true
    EventMonitoring.deletedby = loggedInUser
    EventMonitoring.deletedreasonothertext = this.OthereReason
    // ---------------------------------------------------





    //--------------------
    Object.keys(EventMonitoring).map((e) => { if (e.startsWith("_")) delete EventMonitoring[e]; })
    newObsEvent.observationfrequency = EventMonitoring.observationfrequency
    Object.keys(newObsEvent).map((e) => { if (e.startsWith("_")) delete newObsEvent[e]; })


    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEvent)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.selectedbloodGlucose = null;
      this.showEdit = false;
      this.showDelete = false;
      this.OthereReason = ""
      this.LatestRecordSelected = false
      this.init();
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BloodGlucose)
    },
      (error) => {
        this.OthereReason = ""
        console.log(error)
        this.showEditRecordError = true;
        this.editRecordError = error

      }
    );

  }

  ShowRecordHistory(Record: any) {
    // this.selectedbloodGlucose = JSON.parse(JSON.stringify(Record));
    // this.RecordHistory = JSON.parse(this.selectedposturalbloodpressure.__posturalbloodpressure)
    // this.RecordHistory.sort((a, b) => new Date(b.modifiedon).getTime() - new Date(a.modifiedon).getTime());
    // this.showEditHistory = true;
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

  ChoosenfilterdateChange(selectvalue: any) {

  }

  createFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id";
    // let condition = "person_id = @person_id";

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));

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
    this.monitoringFrequencyData = event;

    // if(this.env == 'mental_healthcare' && this.monitoringFrequencyData && this.monitoringFrequencyData.frequency_reason == "null") {
    //   this.disableSubmit = true;
    // }
    // else {
    //   this.disableSubmit = false;
    // }
  }

  closeBloodGlucoseModal() {
    this.subject.closeModal.next('close modal');
  }

  // loadChart() {
  //   const items = [];
  //   this.monitoringFrequencyHistoryData.forEach(element => {
  //     items.push({ x: moment(element.datestarted).toDate(), y: element.bloodglucose })
  //   });

  //   // Configuration for the Graph2d
  //   const options: Graph2dOptions = {
  //     dataAxis: {
  //       left: {
  //         title: {
  //           text: 'cm'
  //         }
  //       }
  //     },
  //     start: moment().subtract(5, 'days').toDate(),
  //     end: moment().add(5, 'days').toDate(),
  //     drawPoints: {
  //       style: 'circle' // 'square' also possible
  //     },

  //   };

  //   // Create a Graph2d
  //   this.graph2d = new Graph2d(this.visualization.nativeElement, items, options);
  // }

  // zoomIn(): void {
  //   const range = this.graph2d.getWindow();
  //   const interval = range.end - range.start;
  //   this.graph2d.setWindow({
  //     start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
  //     end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
  //   });
  // }

  // zoomOut(): void {
  //   const range = this.graph2d.getWindow();
  //   const interval = range.end - range.start;
  //   this.graph2d.setWindow({
  //     start: moment(range.start).subtract(interval * 0.2, 'milliseconds').toDate(),
  //     end: moment(range.end).add(interval * 0.2, 'milliseconds').toDate()
  //   });
  // }
  showReasonAlert(reason) {

    this.subject.showReasonModal.next(reason);
  }
  openCollapseGraph() {
    this.Showchart = true
    // if (this.monitoringFrequencyHistoryData) {
    //   const config = {
    //     backdrop: true,
    //     ignoreBackdropClick: true,
    //     class: 'modal-dialog-centered modal-lg',
    //     initialState: {
    //       errorMessage: "",
    //       chartData: this.monitoringFrequencyHistoryData,
    //       chartConfig: this.chartConfig
    //     }
    //   };
    //   this.bsGraphModalRef = this.modalService.show(ChartComponent, config);
    // }
  }
  showeModelditdiscardMethod(Method: string) {
    this.showEditValidate7DayError = false

    if (Method == "edit") {
      let isedited = true;
      let Record = this.bloodGlucoseDetail.find(x => x.observationevent_id == this.selectedbloodGlucose.observationevent_id)
      if (this.selectedbloodGlucose.__bloodglucose.value == Record.__bloodglucose.value && this.selectedbloodGlucose.__recorded.value == Record.__recorded.value && this.selectedbloodGlucose.patientrefused == Record.patientrefused) {
        if (!this.LatestRecordSelected) { // is its not latest no need to check monitering and close
          this.showEdit = false;
          return
        }
        if (this.monitoringFrequencyData.frequency_entered == Record.__observationeventmonitoring.frequency_entered
          && this.monitoringFrequencyData.frequency_reason == Record.__observationeventmonitoring.frequency_reason && this.monitoringFrequencyData.frequencyunit_entered == Record.__observationeventmonitoring.frequencyunit_entered && this.monitoringFrequencyData.isstop == Record.__observationeventmonitoring.isstop) {
          this.showEdit = false
        }
        else {
          this.showeditdiscard = true
        }

      }
      else {
        this.showeditdiscard = true

      }

    }
    else {

      if (!this.bloodGlucose && this.recordedAt == "" && !this.patientrefuse) {

        if (this.bloodGlucoseDetail.length > 0) {

          if (this.monitoringFrequencyData.frequency_entered == this.bloodGlucoseDetail[0].__observationeventmonitoring.frequency_entered
            && this.monitoringFrequencyData.frequency_reason == this.bloodGlucoseDetail[0].__observationeventmonitoring.frequency_reason && this.monitoringFrequencyData.frequencyunit_entered == this.bloodGlucoseDetail[0].__observationeventmonitoring.frequencyunit_entered && this.monitoringFrequencyData.isstop == this.bloodGlucoseDetail[0].__observationeventmonitoring.isstop) {
            this.subject.closeModal.next('close modal');
          }
          else {
            this.showeModelditdiscard = true
          }
        }
        if (this.monitoringFrequencyData.frequency_entered == "null" && this.monitoringFrequencyData.frequency_reason_other == "Monitoring not started" && this.monitoringFrequencyData.frequency_reason == "Other" && this.monitoringFrequencyData.frequencyunit_entered == "null" && this.monitoringFrequencyData.isstop == true) {
          this.subject.closeModal.next('close modal');
        }
        else {
          this.showeModelditdiscard = true
        }

      }
      else {
        this.showeModelditdiscard = true
      }

    }




  }


}
