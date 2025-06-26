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
// import { HeaderService } from '../services/header.service';
// import { ComponentModuleData } from '../directives/whatthreewords-loader.directive';
import { ApirequestService } from '../services/apirequest.service';
import { Observation, Observationevent, ObservationEventMonitoring } from '../models/person.model';
import { SharedDataContainerService } from '../services/shared-data-container.service';
import { AuthenticationService } from '../services/authentication.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { UpsertTransactionManager } from '../services/upsert-transaction-manager.service';
// import { AppConfig } from '../app.config';
import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Graph2d, Graph2dOptions } from 'vis-timeline/standalone';
import { AppService, BadgeNames } from '../services/app.service';
import { ChartComponent } from '../chart/chart.component';
import { SubjectsService } from '../services/subjects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bristol-stool-chart',
  templateUrl: './bristol-stool-chart.component.html',
  styleUrl: './bristol-stool-chart.component.css'
})
export class BristolStoolChartComponent implements OnDestroy {

  username: any;
  chartConfig: any;
  showStoolTypeModal: boolean = false;
  disabledSubmit: boolean = false;
  messageSuccess: boolean;
  subscriptions: Subscription = new Subscription();

  constructor(public subject: SubjectsService, public modalService: BsModalService, public bsGraphModalRef: BsModalRef,private apiRequest: ApirequestService, private sharedData: SharedDataContainerService, private authService: AuthenticationService, public appService: AppService) {
    this.chartConfig = {'chartHeading':'Bristol Stool','UOM':'Type'}
    this.observationtype = {
      'observationtype': 'bristolstoolchart',
      'RBAC': this.appService.AuthoriseAction('eobs_set_monitoring_freq_bristol_stool_chart')
    }
    // this.defaultMonitoringFrequencyData = {
    //   'frequency_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue,
    //   'frequencyunit_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit
    // };
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;
    //  this.minTime.setHours(9, 0, 0); // Sets minTime to 9:00 AM

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.init();
    // this.sharedData.getCurrentEncounter((encounterId: any) => {
    //   this.today.setHours(4)
      this.encounterId = this.appService.encounter.encounter_id;
    // });
  }

  rowForHistoryViewer = [
    {
      'id': 'value',
      'fieldName': 'Type'
    },
    {
      'id': 'datestarted',
      'fieldName': 'Observation Time'
    },
    {
      'id': 'frequency_entered',
      'fieldName': 'Monitoring Frequency'
    },
    {
      'id': 'reason',
      'fieldName': 'Reason'
    },
    {
      'id': 'createdby',
      'fieldName': 'Recorded By'
    },
    {
      'id': 'createddate',
      'fieldName': 'Recorded Date/Time'
    },
    {
      'id': 'reasonforrefusal',
      'fieldName': 'Reason for Refusal'
    },
    {
      'id': 'additionalcomments',
      'fieldName': 'Additional Comments'
    },
    {
      'id': 'action',
      'fieldName': ''
    },
  ]
  showError = false;
  recordedError = false;
  monitoringFrequencyData: any;
  observationtype: any;
  showEdit = false;
  showDelete = false;
  ShowHistory = false;
  showEditHistory = false;
  selectedBristolStool: any;
  bristolStool: number;
  bristolstooltype = ""
  monitaringFrequency: any;
  monitaringFrequencyunit: string;
  encounterId = "";
  bristolStoolDetails: any;
  Obsevation: any;
  obsevationevent: any;

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
  editRecordError = "";
  showEditRecordError = false;
  messageError: boolean = false;
  showValidate7DayError: boolean = false;
  showEditValidate7DayError: boolean = false;
  currentRecordedFrequencyAndReason: string = '';
  showAddButton: boolean = true;
  Showchart=false
  deleteReason: string;
  patientrefused = false;
  showpatientrefusedlink = true;
  reasonforRefusal = "";
  patientrefusederror = false;
  additionalcomments: string = '';

  @ViewChild('visualization', { static: false }) visualization!: ElementRef;


  init() {
    this.Choosenfilterdate = new Date();
    this.mindate = new Date()
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;
    this.minTime.setMinutes(this.minTime.getMinutes() , 0, 0)
    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/terminus_bristolstooldetails`, this.createFilter())
      .subscribe(
        (bristolstool) => {
          this.monitoringFrequencyHistoryData = [];

          this.bristolStoolDetails = bristolstool
          this.bristolStoolDetails.sort((b, a) => new Date(a.datestarted).getTime() - new Date(b.datestarted).getTime());
          for (let Obj of this.bristolStoolDetails) {

            Obj.__bristolstool = JSON.parse(Obj.__bristolstool)[0]
            Obj.__observationeventmonitoring = JSON.parse(Obj.__observationeventmonitoring)[0]
            Obj.__history = JSON.parse(Obj.__history)

            this.monitoringFrequencyHistoryData.push(
              {
                'datestarted': moment(Obj.datestarted), 
                'value': (typeof Obj.__bristolstool === "undefined") ? (Obj.patientrefused == true ? "Patient Refused":"") : (Obj.patientrefused == true ? "Patient Refused" : Obj.__bristolstool.value),
                'frequency_entered': Obj.__observationeventmonitoring.isstop?'Monitoring Stopped':((Obj.__observationeventmonitoring.frequency_entered != 'null' ? Obj.__observationeventmonitoring.frequency_entered: '') + ' ' + (Obj.__observationeventmonitoring.frequencyunit_entered != 'null' ?Obj.__observationeventmonitoring.frequencyunit_entered:'')),
                'reason': (Obj.__observationeventmonitoring && Obj.__observationeventmonitoring.frequency_reason != 'null' && Obj.__observationeventmonitoring.frequency_reason != null ? (Obj.__observationeventmonitoring.frequency_reason == 'Other' || Obj.__observationeventmonitoring.frequency_reason.includes('Rapid tranquilisation')) ? (Obj.__observationeventmonitoring.frequency_reason_other || Obj.__observationeventmonitoring.frequency_reason): Obj.__observationeventmonitoring.frequency_reason : ''),
                'frequency_reason': Obj.__observationeventmonitoring.frequency_reason,
                'additionalcomments': Obj.__observationeventmonitoring.monitoringcomments,
                'frequency_reason_other': (Obj.__observationeventmonitoring.frequency_reason == 'Other')? Obj.__observationeventmonitoring.frequency_reason_other: null,
                'createddate': moment(Obj._createddate).format('DD-MM-yyyy HH:mm'),
                'createdby': Obj.addedby,
                'action': '',
                'observationevent_id': Obj.observationevent_id,
                'eventcorrelationid': Obj.eventcorrelationid,
                'isamended': Obj.isamended,
                'isdeleted': Obj.isdeleted,
                'reasonforrefusal': Obj.patientrefused == true ? Obj.reasonforpatientrefused: '',
                'clickedAction': '',
                'showEdit': this.appService.AuthoriseAction('eobs_edit_bristol_stool_chart'),
                'showHistory': true,
                'componentCalled': 'bristol_stool'
              })
          }
          // this.loadChart();
          if(this.monitoringFrequencyHistoryData.length > 0) {
            if(!this.bristolStoolDetails[0].__observationeventmonitoring.isstop) {
              this.currentRecordedFrequencyAndReason = '- every '+this.monitoringFrequencyHistoryData[0].frequency_entered + ' - ' + (this.monitoringFrequencyHistoryData[0].frequency_reason == 'Other' ? this.monitoringFrequencyHistoryData[0].frequency_reason_other : this.monitoringFrequencyHistoryData[0].frequency_reason);
            }
            else {
              this.currentRecordedFrequencyAndReason = ''
            }
            if(this.bristolStoolDetails[0].__observationeventmonitoring.frequency_entered) {
              
              if(this.bristolStoolDetails[0].__observationeventmonitoring.isstop) {
                this.defaultMonitoringFrequencyData = {
                  'frequency_entered': '',
                  'frequencyunit_entered': 'null',
                  'isstop': this.bristolStoolDetails[0].__observationeventmonitoring.isstop,
                  'frequency_reason': this.bristolStoolDetails[0].__observationeventmonitoring.frequency_reason,
                  'frequency_reason_other': this.bristolStoolDetails[0].__observationeventmonitoring.frequency_reason_other
                };
              }
              else {
                this.defaultMonitoringFrequencyData = {
                  'frequency_entered': this.bristolStoolDetails[0].__observationeventmonitoring.frequency_entered,
                  'frequencyunit_entered': this.bristolStoolDetails[0].__observationeventmonitoring.frequencyunit_entered,
                  'frequency_reason': this.bristolStoolDetails[0].__observationeventmonitoring.frequency_reason,
                  'frequency_reason_other': this.bristolStoolDetails[0].__observationeventmonitoring.frequency_reason_other
                };
              }
              
            }
            
          }
          else {
            this.defaultMonitoringFrequencyData = {
              'isstop': true,
              'frequency_reason': 'Other',
              'frequency_reason_other': 'Monitoring not started'
            };
          }
        },

      ))
  }

  ngOnInit(): void {
      this.username = this.appService.loggedInUserName;
  }

  SaveObservation() {
    this.showError = false;
    this.recordedError = false;
    this.patientrefusederror = false;
    this.disabledSubmit = true;
    this.showValidate7DayError=false;
    this.showAddButton = false;

    if (this.patientrefused && this.reasonforRefusal.trim() == "") {
      this.patientrefusederror = true;
      this.showAddButton = true;
      return;
    }

    if(!this.patientrefused && !this.appService.AuthoriseAction('eobs_set_monitoring_freq_bristol_stool_chart' )) {
      if(this.bristolstooltype == '' || this.bristolstooltype == null || this.bristolstooltype == "null") {
        this.showError=true;
        this.showAddButton = true;
        return;
      }
    }

    if(!this.monitoringFrequencyData.monitoringnotrequired && !this.monitoringFrequencyData.isstop && !this.monitoringFrequencyData.ispause) {
      if(this.monitoringFrequencyData.frequency_entered == 0 || this.monitoringFrequencyData.frequency_entered == '' || this.monitoringFrequencyData.frequency_entered == null || this.monitoringFrequencyData.frequency_entered == "null" || this.monitoringFrequencyData.frequencyunit_entered == "null" || this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == '') {
        this.showError=true;
        this.showAddButton = true;
        return;
      }
      else {
        let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
        if(validateTo7Days) {
          this.showValidate7DayError=true;
          this.showAddButton = true;
          return;
        }
      }
    }
    if (this.monitoringFrequencyData.frequency_reason == 'null' || this.monitoringFrequencyData.frequency_reason == null) {
      this.showError = true;
      this.showAddButton = true;
      return;
    }
    else {
      if (this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
        this.showError = true;
        this.showAddButton = true;
        return;
      }
    }
    
    let eventcorrelationid = uuidv4();

    let Obsbristolstool = null
    let ObsrecordedAt = null
    let newObsEvent = this.createObservationEvent(eventcorrelationid, "46cade37-8e71-4c92-8f4d-8efa5b8a0ae6");

    let value = this.bristolstooltype ? this.bristolstooltype.toString() : ""

    if (!this.patientrefused) {
      Obsbristolstool = this.createObservation(newObsEvent, eventcorrelationid, "46cade37-8e71-4c92-8f4d-8efa5b8a0ae6", value)
    }


    let EventMonitoring = new ObservationEventMonitoring(uuidv4(), newObsEvent.observationevent_id, this.monitoringFrequencyData.monitoringFrequency, null, "false", "false", "null", "null", null, this.additionalcomments, eventcorrelationid,
      false, false, false, this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered, this.monitoringFrequencyData.frequency_reason, this.monitoringFrequencyData.frequency_reason_other
      , this.monitoringFrequencyData.ispause, this.monitoringFrequencyData.isstop, this.monitoringFrequencyData.isnews2suggestestedfreq, this.monitoringFrequencyData.observationtype_id, this.monitoringFrequencyData.observationtypetext, false, null, null, this.monitoringFrequencyData.monitoringnotrequired)

    newObsEvent.observationfrequency = EventMonitoring.observationfrequency

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(`${this.appService.baseURI}`, this.apiRequest);
    upsertManager.addEntity('core', 'observationevent', JSON.parse(JSON.stringify(newObsEvent)));

    if (!this.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsbristolstool)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObsrecordedAt)));
    }



    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.init()
      this.ShowHistory = false;
      this.patientrefused = false
      this.bristolStool = null;
      this.bristolstooltype = ""
      this.messageSuccess = true;
      setTimeout(() => {                           // <<<---using ()=> syntax
        this.messageSuccess = false;
      }, 2000);
      this.showAddButton = true;
      this.defaultMonitoringFrequencyData = {
        'frequency_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue,
        'frequencyunit_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit
      };
      this.subject.frameworkEvent.next("REFRESH_BANNER");
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BristolStoolChart)
    },
      (error) => {
        this.messageError = true;
        setTimeout(() => {                           // <<<---using ()=> syntax
          this.messageError = false;
        }, 2000);
        console.log(error)
      });

  }
  createObservation(Observationevent: Observationevent, eventcorrelationid: any, observationtype_id: string, value = "") {
    return new Observation(
      uuidv4(), "", "", Observationevent.datefinished,
      Observationevent.observationevent_id, observationtype_id,
      "", value.toString(), false, this.appService.loggedInUserName, eventcorrelationid, null);
  }

  createObservationEvent(eventcorrelationid: any, eventType: string) {
    let loggedInUser = this.username = this.appService.loggedInUserName

    let patientrefused = null;
    let refusalreason = null;
    if (this.patientrefused) {
      patientrefused = this.patientrefused
      refusalreason = this.reasonforRefusal
    }

    return new Observationevent(
      uuidv4(), this.appService.personId, this.appService.getDateTimeinISOFormat(this.Choosenfilterdate), this.appService.getDateTimeinISOFormat(this.Choosenfilterdate), loggedInUser,
      this.encounterId, false, 168, "", null, null, loggedInUser, null, null, null, null, null, eventType, eventcorrelationid, null, null, null, this.monitoringFrequencyData.observationtypetext, null, patientrefused, refusalreason);
  }

  receivehistoryViewerData(data) {
    if (data.clickedAction == "showHistory") {
      let Record = this.bristolStoolDetails.find(x => x.observationevent_id == data.observationevent_id)
      this.selectedBristolStool = JSON.parse(JSON.stringify(Record));
      this.RecordHistory = this.selectedBristolStool.__history;
      this.RecordHistory.sort((a, b) => new Date(b._createddate).getTime() - new Date(a._createddate).getTime());
      this.showEditHistory = true;
    }
    else {
      let Record = this.bristolStoolDetails.find(x => x.observationevent_id == data.observationevent_id)
      if (Record.observationevent_id == this.bristolStoolDetails[0].observationevent_id) {
        this.LatestRecordSelected = true
      }
      else {
        this.LatestRecordSelected = false;
      }     
      this.showEditRecordError = false;
      this.showEditValidate7DayError=false;
      this.showEdit = true;
      this.defaultMonitoringFrequencyData = {
        'frequency_entered': Record.__observationeventmonitoring.frequency_entered,
        'frequencyunit_entered': Record.__observationeventmonitoring.frequencyunit_entered,
        'isstop':Record.__observationeventmonitoring.isstop,
        'ispause':Record.__observationeventmonitoring.ispause,
        'monitoringnotrequired': Record.__observationeventmonitoring.monitoringnotrequired,
        "frequency_reason":Record.__observationeventmonitoring.frequency_reason,
        "frequency_reason_other":Record.__observationeventmonitoring.frequency_reason_other,
        'monitoringcomments': Record.__observationeventmonitoring.monitoringcomments,
      }
      
      if (Record.patientrefused) {
        Record.__bristolstool = JSON.parse(JSON.stringify(this.createObservation(Record, Record.eventcorrelationid, "46cade37-8e71-4c92-8f4d-8efa5b8a0ae6", "")));
      }

      this.selectedBristolStool = JSON.parse(JSON.stringify(Record));
      this.selectedBristolStool.reasonforamend = "Entered in error";
    }
  }

  saveEditorDelete(action: string) {
    this.showEditRecordError = false;
    this.showEditValidate7DayError=false;
    if (action != "Delete") {
      if( !this.selectedBristolStool.patientrefused && !this.appService.AuthoriseAction('eobs_set_monitoring_freq_bristol_stool_chart')) {
        if(this.selectedBristolStool.__bristolstool.value == '' || this.selectedBristolStool.__bristolstool.value == null || this.selectedBristolStool.__bristolstool.value == "null") {
          this.showEditRecordError = true;
          this.editRecordError="Please select Bristol stool type"
          return;
        }
      } 

      if (this.selectedBristolStool.patientrefused && (this.selectedBristolStool.reasonforpatientrefused == null || this.selectedBristolStool.reasonforpatientrefused == 'null' || this.selectedBristolStool.reasonforpatientrefused.trim() == "")) {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Patient Refuse Reason."
        return;
      }

      if (this.LatestRecordSelected && (this.monitoringFrequencyData.frequency_entered == 0 || this.monitoringFrequencyData.frequency_entered == 'null' || this.monitoringFrequencyData.frequency_entered == null || this.monitoringFrequencyData.frequency_entered == '') && !this.monitoringFrequencyData.isstop) {
        this.showEditRecordError = true;
        this.editRecordError="Please enter Monitoring Frequency"
        return;
      }
      if (this.LatestRecordSelected && (this.monitoringFrequencyData.frequencyunit_entered == 'null' || this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == '') && !this.monitoringFrequencyData.isstop) {
        this.showEditRecordError = true;
        this.editRecordError="Please select Monitoring Frequency unit"
        return;
      }
      if (this.LatestRecordSelected && (this.monitoringFrequencyData.frequency_reason == 'null' || this.monitoringFrequencyData.frequency_reason == null || this.monitoringFrequencyData.frequency_reason == '')) {
        this.showEditRecordError = true;
        this.editRecordError = "Please enter Frequency reason"
        return;
      }
      else {
        if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
          this.showEditRecordError = true;
          this.editRecordError = "Please enter Frequency reason"
          return;
        }
      }
      if (!this.selectedBristolStool.patientrefused && this.selectedBristolStool.reasonforamend == "Other") {
        if(this.OthereReason == '' || this.OthereReason == null) {
          this.showEditRecordError = true;
          this.editRecordError = "Please enter Other reason"
          return;
        }
      }
      if(this.monitoringFrequencyData.frequency_entered && this.monitoringFrequencyData.frequencyunit_entered) {
        let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
        if(validateTo7Days) {
          this.showEditValidate7DayError=true;
          return;
        }
      }
    }
    let loggedInUser = this.appService.loggedInUserName
    if (this.selectedBristolStool.reasonforamend == "Other") {
      this.selectedBristolStool.reasonforamendother = this.OthereReason;
    }
    let eventcorrelationid = uuidv4();

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(`${this.appService.baseURI}`, this.apiRequest);

    let newObsEvent = JSON.parse(JSON.stringify(this.selectedBristolStool));
    newObsEvent.eventcorrelationid = eventcorrelationid
    newObsEvent.isamended = true;
    newObsEvent.addedby=loggedInUser

    // ---------------------------------------------------
    let ObsBristolStool = this.selectedBristolStool.__bristolstool

    ObsBristolStool.eventcorrelationid = eventcorrelationid
    Object.keys(ObsBristolStool).map((e) => { if (e.startsWith("_")) delete ObsBristolStool[e]; })

    ObsBristolStool._createdby = loggedInUser
    if (!newObsEvent.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObsBristolStool)));
    }
    // ---------------------------------------------------

    this.selectedBristolStool.addedby = loggedInUser;
    let EventMonitoring = this.selectedBristolStool.__observationeventmonitoring
     EventMonitoring.eventcorrelationid = eventcorrelationid
    if(this.LatestRecordSelected)
      { 
     EventMonitoring = new ObservationEventMonitoring(EventMonitoring.observationeventmonitoring_id, newObsEvent.observationevent_id, this.monitoringFrequencyData.monitoringFrequency, null, "false", "false", "null", "null", null, this.selectedBristolStool.__observationeventmonitoring.monitoringcomments, eventcorrelationid,
      false, false, false, this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered, this.monitoringFrequencyData.frequency_reason, this.monitoringFrequencyData.frequency_reason_other
      , this.monitoringFrequencyData.ispause, this.monitoringFrequencyData.isstop, this.monitoringFrequencyData.isnews2suggestestedfreq, this.monitoringFrequencyData.observationtype_id, this.monitoringFrequencyData.observationtypetext, false, null, null, this.monitoringFrequencyData.monitoringnotrequired)
      }
    // ---------------------------------------------------

    Object.keys(EventMonitoring).map((e) => { if (e.startsWith("_")) delete EventMonitoring[e]; })
    newObsEvent.observationfrequency = EventMonitoring.observationfrequency
    Object.keys(newObsEvent).map((e) => { if (e.startsWith("_")) delete newObsEvent[e]; })


    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEvent)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.selectedBristolStool = null;
      this.showEdit = false;
      this.showDelete = false;
      this.LatestRecordSelected=false;
      this.defaultMonitoringFrequencyData = {
        'frequency_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue,
        'frequencyunit_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit
      };
      this.init();
      this.subject.frameworkEvent.next("REFRESH_BANNER");
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BristolStoolChart)
    },
      (error) => {

        console.log(error)
      });

  }

  deleteobservation(action: string) {
    this.showEditRecordError = false;
   
    let loggedInUser = this.appService.loggedInUserName
    let Record = this.bristolStoolDetails.find(x => x.observationevent_id == this.selectedBristolStool.observationevent_id)
    Record.reasonforamend = this.selectedBristolStool.reasonforamend
    this.selectedBristolStool = JSON.parse(JSON.stringify(Record));

    if (this.selectedBristolStool.reasonforamend == "Other") {
      this.selectedBristolStool.reasonforamendother = this.OthereReason;
    }

    if(this.deleteReason) {
      this.selectedBristolStool.reasonforamend = this.deleteReason;
    }
    let eventcorrelationid = uuidv4();
   
    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let newObsEvent = JSON.parse(JSON.stringify(this.selectedBristolStool));
    newObsEvent.eventcorrelationid = eventcorrelationid
    newObsEvent.isamended = true;
    newObsEvent.addedby=loggedInUser

    newObsEvent.isdeleted = true;
    newObsEvent.deletedby = loggedInUser
    newObsEvent.reasonfordelete = this.selectedBristolStool.reasonforamend
    newObsEvent.deletedreasonothertext = this.OthereReason;
      

    // ---------------------------------------------------
    let ObdBristolStool = this.selectedBristolStool.__bristolstool

    ObdBristolStool.eventcorrelationid = eventcorrelationid
    Object.keys(ObdBristolStool).map((e) => { if (e.startsWith("_")) delete ObdBristolStool[e]; })

    ObdBristolStool._createdby = loggedInUser
    if (!newObsEvent.patientrefused) {
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(ObdBristolStool)));
    }

    // ---------------------------------------------------
    let EventMonitoring = this.selectedBristolStool.__observationeventmonitoring
     EventMonitoring.eventcorrelationid = eventcorrelationid
     EventMonitoring.isdeleted = true
      EventMonitoring.deletedby = loggedInUser
      EventMonitoring.deletedreasonothertext = this.OthereReason
    // ---------------------------------------------------

    Object.keys(EventMonitoring).map((e) => { if (e.startsWith("_")) delete EventMonitoring[e]; })
    newObsEvent.observationfrequency = EventMonitoring.observationfrequency
    Object.keys(newObsEvent).map((e) => { if (e.startsWith("_")) delete newObsEvent[e]; })


    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEvent)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.selectedBristolStool = null;
      this.showEdit = false;
      this.showDelete = false;
      this.LatestRecordSelected=false
      this.init();
      this.subject.frameworkEvent.next("REFRESH_BANNER");
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BristolStoolChart)
    },
      (error) => {

        console.log(error)

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

    console.log('Received data from child:', event);
    this.monitoringFrequencyData = event;
    let fres= parseInt( this.monitoringFrequencyData.frequency_entered, 10); 
    this.monitoringFrequencyData.frequency_entered=  isNaN(fres) || +(fres) == 0 ? "null" : fres.toString();

    // if(this.env == 'mental_healthcare' && this.monitoringFrequencyData && this.monitoringFrequencyData.frequency_reason == "null") {
    //   this.disableSubmit = true;
    // }
    // else {
    //   this.disableSubmit = false;
    // }
  }

  closeBristolStoolModal() {
    // this.headerService.showHideBadgesModal.next(false);
    this.subject.closeModal.next('close modal');
  }

  openCollapseGraph() {
    // if(this.monitoringFrequencyHistoryData) {
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
    this.Showchart=true;
  }

  openDeleteModal() {
    this.showEdit = false;
    this.showDelete = true;
    this.deleteReason = 'Entered in error'
  }

  patientrefusedChange() {
    if (!this.patientrefused) {
      this.showpatientrefusedlink = true;
    }
  }

  showReasonAlert(reason){
    this.subject.showReasonModal.next(reason);
   }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
