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
import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticationService } from '../services/authentication.service';
import { Observation, Observationevent, ObservationEventMonitoring, Observationscaletype, PersonObservationScale } from '../models/person.model';
import { SharedDataContainerService } from '../services/shared-data-container.service';
import { UpsertTransactionManager } from '../services/upsert-transaction-manager.service';
import { ApirequestService } from '../services/apirequest.service';
import { filter, filterparam, filterParams, filters, orderbystatement, selectstatement } from '../models/filter.model';
import moment from 'moment';
import { AppService, BadgeNames } from '../services/app.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { SubjectsService } from '../services/subjects.service';
import { Subscription } from 'rxjs';
import { PersonAdditionalGuidance } from '../models/personAdditionalGuidance.model';
// import { HeaderService } from './services/header.service';

@Component({
  selector: 'app-observation-monitoring-frequency',
  templateUrl: './observation-monitoring-frequency.component.html',
  styleUrls: ['./observation-monitoring-frequency.component.css']
})
export class ObservationMonitoringFrequencyComponent implements OnInit {

  monitoringFrequencyData: any;
  observationtype: any;
  env: string = "mental_healthcare"
  showHistoryModal: boolean = false;
  defaultMonitoringFrequencyData: any;
  editMonitoringFrequencyData: any;
  public today = new Date();
  encounterId = "";
  GetobservationmonitoringfrequencyDetail: any;
  monitoringFrequencyHistoryData = [];
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showObsMonitoringFrequencyModal: boolean = true;
  rowForHistoryViewer: any;
  selectedObsMonitoringFrequency: any;
  RecordHistory: any;
  showEditHistory: boolean = false;
  OthereReason = "";
  previouslyRecordedFrequency: string;
  showError: boolean =false;
  showEditError: boolean = false;
  messageSuccess: boolean = false;
  subscriptions: Subscription = new Subscription();
  messageError: boolean = false;
  showValidate7DayError: boolean = false;
  validationMaxHours: number;
  validationMaxUnit: string;
  validationMaxHoursText: string;
  defaultMonitoringFrequency: any;
  //additionalclinicalguidance: string;

  showAdditionalGuidanceModal: boolean = false;
  Choosenfilterdate:any;
  showHistory: boolean = false;
  personAdditionalGuidance: PersonAdditionalGuidance = new PersonAdditionalGuidance();
  guidanceText: string;
  historyData: any;
  filteredData: any;
  isAmend: boolean = false;
  showEditButton: boolean = false;

  constructor(public subject: SubjectsService, public modalService: BsModalService,private authService: AuthenticationService, private sharedData: SharedDataContainerService,private apiRequest: ApirequestService,public appService:AppService) {
  
    this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetList?synapsenamespace=meta&synapseentityname=observationscaletype").subscribe(
      (response) => {
        let responseArray = JSON.parse(response);
        for (let r of responseArray) {
          this.appService.obsScales.push(<Observationscaletype>r);
        }

        //get person scale type
        this.subscriptions.add(this.apiRequest.getRequest(this.appService.baseURI + "/GetListByAttribute?synapsenamespace=core&synapseentityname=personobservationscale&synapseattributename=person_id&attributevalue=" + this.appService.personId)
          .subscribe(
            (personobservationscale) => {
              let personobservationscalelist = <PersonObservationScale[]>JSON.parse(personobservationscale);
              if (personobservationscalelist.length > 0) {
                this.appService.personscale = personobservationscalelist[0];
                this.appService.logToConsole("updating app service person scale type");
                this.appService.logToConsole(this.appService.personscale);
              }

              this.appService.setCurrentScale();
              // this.loadComplete.emit("Observations form component ready");

              // this.subjects.drawGraph.next(true);

              // this.appService.isInitComplete = true;

              if(this.appService.GetChartType() == 'NEWS2') {
                this.observationtype = {
                  'observationtype': 'news2frequency',
                  'RBAC': this.appService.AuthoriseAction('eobs_change_monitoring_freq')
                }
              }
              else if(this.appService.GetChartType() == 'PEWS') {
                this.observationtype = {
                  'observationtype': 'pewsfrequency',
                  'RBAC': this.appService.AuthoriseAction('eobs_change_monitoring_freq')
                }
              }
              else if(this.appService.GetChartType() == 'MEWS') {
                this.observationtype = {
                  'observationtype': 'mewsfrequency',
                  'RBAC': this.appService.AuthoriseAction('eobs_change_monitoring_freq')
                }
              }
              else if(this.appService.GetChartType() == 'Marsi MEWS') {
                this.observationtype = {
                  'observationtype': 'marsifrequency',
                  'RBAC': this.appService.AuthoriseAction('eobs_change_monitoring_freq')
                }
              }

              this.init();
              
            }
          ));
      }));
    

      this.today.setHours(4)
      this.encounterId =  this.appService.encounter.encounter_id;
 

    this.rowForHistoryViewer = [
      {
        'id':'chart_type',
        'fieldName':'Chart type'
      },
      {
      'id':'datestarted',
      'fieldName':'Recorded Date/Time'
      },
      {
      'id':'monitoring_frequency',
      'fieldName':'Monitoring Frequency'
      },
      {
      'id':'reason',
      'fieldName':'Reason'
      },
      {
      'id':'completed_by',
      'fieldName':'Recorded By'
      },
      {
      'id':'action',
      'fieldName':''
      },]

      // this.init();
   }

  ngOnInit(): void {
    // this.setDefaultMonitoringFrequency()
    this.defaultMonitoringFrequency = this.appService.appConfig.ObservationMonitoringFrequency;
    this.getAdditionalClinicalGuidanceHistory();
  }

  init() {
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/terminus_observationmonitoringfrequencydetails`, this.createFilter())      
    .subscribe(
      (Getobservationmonitoringfrequency) => {
        this.monitoringFrequencyHistoryData=[];
        
        this.GetobservationmonitoringfrequencyDetail = Getobservationmonitoringfrequency
        this.GetobservationmonitoringfrequencyDetail.sort((b, a) => new Date(a.datestarted).getTime() - new Date(b.datestarted).getTime());
        
        if(this.GetobservationmonitoringfrequencyDetail) {
          for(let Obj of this.GetobservationmonitoringfrequencyDetail){
            Obj.__monitoringfrequency = JSON.parse(Obj.__monitoringfrequency)[0]
            Obj.__monitoringfrequencyhistory = JSON.parse(Obj.__monitoringfrequencyhistory)
            let monitoring_frequency;
            if(Obj.__monitoringfrequency && Obj.__monitoringfrequency.ispause) {
              monitoring_frequency = 'Paused'
            }
            else if(Obj.__monitoringfrequency && Obj.__monitoringfrequency.isstop) {
              monitoring_frequency = 'Monitoring Stopped'
            }
            else if(Obj.__monitoringfrequency && Obj.__monitoringfrequency.monitoringnotrequired) {
              monitoring_frequency = 'Regular Monitoring not required'
            }
            else {
              if(Obj.__monitoringfrequency) {
                monitoring_frequency = (Obj.__monitoringfrequency.frequency_entered +' '+ Obj.__monitoringfrequency.frequencyunit_entered);
              }
              
            }
            let chartType;
            if(Obj.observationtypetext == 'pews' || Obj.observationtypetext == 'pewsfrequency') {
              chartType = 'PEWS'
            }
            else if(Obj.observationtypetext == 'news2' || Obj.observationtypetext == 'news2frequency') {
              chartType = 'NEWS2'
            }
            else if(Obj.observationtypetext == 'mews' || Obj.observationtypetext == 'mewsfrequency') {
              chartType = 'MEWS'
            }
            else if(Obj.observationtypetext == 'marsi' || Obj.observationtypetext == 'marsifrequency') {
              chartType = 'Marsi MEWS'
            }
            this.monitoringFrequencyHistoryData.push(
              {'datestarted':moment(Obj.datestarted),
                'chart_type': chartType,
                'monitoring_frequency': monitoring_frequency,
                'reason': (Obj.__monitoringfrequency && Obj.__monitoringfrequency.frequency_reason != 'null' && Obj.__monitoringfrequency.frequency_reason != null ? (Obj.__monitoringfrequency.frequency_reason == 'Other' || Obj.__monitoringfrequency.frequency_reason.includes('Rapid tranquilisation')) ? (Obj.__monitoringfrequency.frequency_reason_other || Obj.__monitoringfrequency.frequency_reason): Obj.__monitoringfrequency.frequency_reason : ''),
                'completed_by':Obj.addedby,
                'action':'',
                'observationevent_id':Obj.observationevent_id,
                'eventcorrelationid':Obj.eventcorrelationid,
                'isamended':Obj.isamended,
                'isdeleted':Obj.isdeleted,
                'clickedAction':'',
                'showEdit': false,
                'showHistory': false,
                'componentCalled': 'observation_monitoring_frequency'
              })
          }
          if(this.monitoringFrequencyHistoryData.length > 0) {
            this.previouslyRecordedFrequency = (this.monitoringFrequencyHistoryData[0].monitoring_frequency? this.monitoringFrequencyHistoryData[0].monitoring_frequency : '') + (this.monitoringFrequencyHistoryData[0].reason ? ' ('+ this.monitoringFrequencyHistoryData[0].reason + ')' : '');
          }
          
          // console.log('GetobservationmonitoringfrequencyDetail',this.GetobservationmonitoringfrequencyDetail);
          if(this.GetobservationmonitoringfrequencyDetail[0] && this.GetobservationmonitoringfrequencyDetail[0].__monitoringfrequency) {
            this.defaultMonitoringFrequencyData = {
              'frequency_entered': this.GetobservationmonitoringfrequencyDetail[0].__monitoringfrequency.frequency_entered,
              'frequencyunit_entered': this.GetobservationmonitoringfrequencyDetail[0].__monitoringfrequency.frequencyunit_entered,
              'observationevent_id':this.GetobservationmonitoringfrequencyDetail.observationevent_id,
              'ispause': this.GetobservationmonitoringfrequencyDetail[0].__monitoringfrequency.ispause,
              'isstop': this.GetobservationmonitoringfrequencyDetail[0].__monitoringfrequency.isstop,
              'monitoringnotrequired': this.GetobservationmonitoringfrequencyDetail[0].__monitoringfrequency.monitoringnotrequired
            };
          }
          else {
            this.defaultMonitoringFrequencyData = {
              'frequency_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue,
              'frequencyunit_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit,
              'observationevent_id':this.GetobservationmonitoringfrequencyDetail.observationevent_id,
            };
            // this.setDefaultMonitoringFrequency()
          }
          console.log(this.defaultMonitoringFrequencyData );
        }
        else {
          this.defaultMonitoringFrequencyData = {
            'frequency_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue,
            'frequencyunit_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit,
            'observationevent_id':this.GetobservationmonitoringfrequencyDetail.observationevent_id,
          };
          // this.setDefaultMonitoringFrequency()
        }

      },
      
    ))

    // this.getLatestScore();
  }

  saveObsMonitoringFrequency() {
    this.showError=false;
    this.showValidate7DayError = false;
    //this.Choosenfilterdate.setTime(this.Choosenfiltertime.getTime()) 
    if(!this.monitoringFrequencyData.ispause && !this.monitoringFrequencyData.isstop && !this.monitoringFrequencyData.monitoringnotrequired) {
      if(this.monitoringFrequencyData.frequency_entered == '' || this.monitoringFrequencyData.frequency_entered == 'null'  || this.monitoringFrequencyData.frequency_entered == null || this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == 'null' || this.monitoringFrequencyData.frequencyunit_entered == '') {
        this.showError=true;
        return;
      }
      else {
        // let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
        // if(validateTo7Days) {
        //   this.showValidate7DayError=true;
        //   return;
        // }
        if(this.observationtype.observationtype == 'news2frequency' || this.observationtype.observationtype == 'pewsfrequency' || this.observationtype.observationtype == 'mewsfrequency' || this.observationtype.observationtype == 'marsifrequency') {
          if(this.validationMaxHours && (this.monitoringFrequencyData.monitoringFrequency > this.validationMaxHours)) {
            this.showValidate7DayError=true;
            return;
          }
        }
        
      }
    }
    if(this.monitoringFrequencyData.frequency_reason == 'null' || this.monitoringFrequencyData.frequency_reason == null)
    { 
      this.showError=true;
      return;
    }
    else{
      if(this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == ""){
        this.showError=true;
        return;
      }
    }
    
    let eventcorrelationid = uuidv4();
    let loggedInUser = this.appService.loggedInUserName
    
    let obsEvent;
    let obsMonitoringFrequency;
    if(this.appService.GetChartType() == 'NEWS2') { 
      obsEvent = this.createObservationEvent(eventcorrelationid,"f075eea5-57f6-45d3-99e7-727df8efa557");
      obsMonitoringFrequency = this.createObservationEventMonitoring(obsEvent,eventcorrelationid,"f075eea5-57f6-45d3-99e7-727df8efa557");
    }
    else if(this.appService.GetChartType() == 'PEWS') {
      obsEvent = this.createObservationEvent(eventcorrelationid,"a2d11ca6-1f5d-4861-9d6b-95cf54d950d7");
      obsMonitoringFrequency = this.createObservationEventMonitoring(obsEvent,eventcorrelationid,"a2d11ca6-1f5d-4861-9d6b-95cf54d950d7");
    }
    else if(this.appService.GetChartType() == 'MEWS') {
      obsEvent = this.createObservationEvent(eventcorrelationid,"dfe91416-7195-451d-af67-961045c83f89");
      obsMonitoringFrequency = this.createObservationEventMonitoring(obsEvent,eventcorrelationid,"dfe91416-7195-451d-af67-961045c83f89");
    }
    else if(this.appService.GetChartType() == 'Marsi MEWS') {
      obsEvent = this.createObservationEvent(eventcorrelationid,"5ba6dc76-fa60-4008-b01d-c9d92f51d954");
      obsMonitoringFrequency = this.createObservationEventMonitoring(obsEvent,eventcorrelationid,"5ba6dc76-fa60-4008-b01d-c9d92f51d954");
    }

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    upsertManager.addEntity('core', 'observationevent', JSON.parse(JSON.stringify(obsEvent)));
    upsertManager.addEntity('core', 'observationeventmonitoring', JSON.parse(JSON.stringify(obsMonitoringFrequency)));

    upsertManager.save((resp) => {
    //   this.systolicsitting= this.systolicstanding =this.diastolicsitting =this.diastolicstanding =null;
      this.init();
      this.showHistoryModal=false;
      this.messageSuccess = true;
      setTimeout(() => {                           // <<<---using ()=> syntax
        this.messageSuccess = false;
      }, 2000);
      this.defaultMonitoringFrequencyData = {
        'frequency_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue,
        'frequencyunit_entered': this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit
      };
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.NEWS2Monitoring)
     
      // if(this.monitoringFrequencyData.ispause) {
      //   this.headerService.changeBadgeIcon.next('pause');
      // }
      // else if(this.monitoringFrequencyData.isstop) {
      //   this.headerService.changeBadgeIcon.next('stop');
      // }
      // else {
      //   this.headerService.changeBadgeIcon.next('pending');
      // }
      // this.showObsMonitoringFrequencyModal = false
    },
      (error) => {
        this.messageError = true;
        setTimeout(() => {                           // <<<---using ()=> syntax
          this.messageError = false;
        }, 2000);
        console.log(error)

      }
      );
  }

  createObservationEvent(eventcorrelationid: any,eventType:string) {
   
    let loggedInUser = this.appService.loggedInUserName
    
   
    return new Observationevent(
      uuidv4(), this.appService.personId, this.appService.getDateTimeinISOFormat(new Date()), this.appService.getDateTimeinISOFormat(new Date()), loggedInUser,
      this.encounterId, false, this.monitoringFrequencyData.monitoringFrequency, "", null, null, loggedInUser,null,null,null,null,null,eventType,eventcorrelationid,null,null,null,this.observationtype.observationtype, null);
  }

  createObservationEventMonitoring(obsEvent,eventcorrelationid: any,eventType:string) {
   
    let loggedInUser = this.appService.loggedInUserName
    
    return new ObservationEventMonitoring(
      uuidv4(),
      obsEvent.observationevent_id,
      this.monitoringFrequencyData.isstop?null:this.monitoringFrequencyData.monitoringFrequency,
      null,
      "false",
      "false",
      "null",
      "null",
      null,
      null,
      eventcorrelationid,
      false,
      false,
      false,
      this.monitoringFrequencyData.frequency_entered,
      this.monitoringFrequencyData.frequencyunit_entered,
      this.monitoringFrequencyData.frequency_reason,
      this.monitoringFrequencyData.frequency_reason_other,
      this.monitoringFrequencyData.ispause,
      this.monitoringFrequencyData.isstop,
      this.monitoringFrequencyData.isnews2suggestestedfreq,
      eventType,
      this.observationtype.observationtype,
      false,
      null,
      null,
      this.monitoringFrequencyData.monitoringnotrequired
    );

  }

  getDateTime(date=new Date()): string {
   

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

  receiveMonitoringFrequencyData(event) {
    console.log('Received data from child:', event);
    this.monitoringFrequencyData = event;
    if(this.observationtype.observationtype == 'news2frequency') {
      if(this.monitoringFrequencyData.frequency_reason == 'NEWS2 protocol') {
        //Do nothing
      }
      else if(this.monitoringFrequencyData.frequency_reason == 'Acute hospital ED' || this.monitoringFrequencyData.frequency_reason == 'Extended leave' || this.monitoringFrequencyData.frequency_reason == 'AWOL' || this.monitoringFrequencyData.frequency_reason == 'Not appropriate for electronic EWS, alternative paper EWS chart in use') {
        this.monitoringFrequencyData.frequency_entered = null;
        this.monitoringFrequencyData.frequencyunit_entered = null;
        this.monitoringFrequencyData.isstop = true;
        this.monitoringFrequencyData.observationfrequency = null;
      }
      else {
        if(this.monitoringFrequencyData.frequency_reason != '' && this.monitoringFrequencyData.frequency_reason != 'null') {
          if(this.isNEWS2LOW()) {
          }
          else if((this.monitoringFrequencyData.NEWS2Score == undefined && this.monitoringFrequencyData.NEWS2Score.score == null && this.monitoringFrequencyData.NEWS2Score.score != 0)) {
            this.validationMaxHours = 12;
            this.validationMaxUnit = 'hours';
          }
          else {
            this.validationMaxHoursText = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequency_entered: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxHours = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.observationfrequency: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxUnit = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequencyunit_entered:this.defaultMonitoringFrequency.defaultMonitoringFrequencyUnit;
          }
        }
       
      }
    }
    else if(this.observationtype.observationtype == 'pewsfrequency') {
      if(this.monitoringFrequencyData.frequency_reason == 'PEWS protocol') {
        //Do nothing
      }
      else if(this.monitoringFrequencyData.frequency_reason == 'Acute hospital ED' || this.monitoringFrequencyData.frequency_reason == 'Extended leave' || this.monitoringFrequencyData.frequency_reason == 'AWOL' || this.monitoringFrequencyData.frequency_reason == 'Not appropriate for electronic EWS, alternative paper EWS chart in use') {
        this.monitoringFrequencyData.frequency_entered = null;
        this.monitoringFrequencyData.frequencyunit_entered = null;
        this.monitoringFrequencyData.isstop = true;
        this.monitoringFrequencyData.observationfrequency = null;
      }
      else {
        if(this.monitoringFrequencyData.frequency_reason != '' && this.monitoringFrequencyData.frequency_reason != 'null') {
          if(this.isPEWSLOW()) {
          }
          else if((this.monitoringFrequencyData.NEWS2Score == undefined && this.monitoringFrequencyData.NEWS2Score.score == null && this.monitoringFrequencyData.NEWS2Score.score != 0)) {
            this.validationMaxHours = 12;
            this.validationMaxUnit = 'hours';
          }
          else {
            this.validationMaxHoursText = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequency_entered: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxHours = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.observationfrequency: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxUnit = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequencyunit_entered:this.defaultMonitoringFrequency.defaultMonitoringFrequencyUnit;
          }
        }
       
      }
    }
    else if(this.observationtype.observationtype == 'mewsfrequency') {
      if(this.monitoringFrequencyData.frequency_reason == 'MEWS protocol') {
        //Do nothing
      }
      else if(this.monitoringFrequencyData.frequency_reason == 'Acute hospital ED' || this.monitoringFrequencyData.frequency_reason == 'Extended leave' || this.monitoringFrequencyData.frequency_reason == 'AWOL' || this.monitoringFrequencyData.frequency_reason == 'Not appropriate for electronic EWS, alternative paper EWS chart in use') {
        this.monitoringFrequencyData.frequency_entered = null;
        this.monitoringFrequencyData.frequencyunit_entered = null;
        this.monitoringFrequencyData.isstop = true;
        this.monitoringFrequencyData.observationfrequency = null;
      }
      else {
        if(this.monitoringFrequencyData.frequency_reason != '' && this.monitoringFrequencyData.frequency_reason != 'null') {
          if(this.isMEWSLOW()) {
          }
          else if((this.monitoringFrequencyData.NEWS2Score == undefined && this.monitoringFrequencyData.NEWS2Score.score == null && this.monitoringFrequencyData.NEWS2Score.score != 0)) {
            this.validationMaxHours = 12;
            this.validationMaxUnit = 'hours';
          }
          else {
            this.validationMaxHoursText = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequency_entered: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxHours = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.observationfrequency: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxUnit = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequencyunit_entered:this.defaultMonitoringFrequency.defaultMonitoringFrequencyUnit;
          }
        }
       
      }
    }
    else if(this.observationtype.observationtype == 'marsifrequency') {
      if(this.monitoringFrequencyData.frequency_reason == 'MARSI protocol') {
        //Do nothing
      }
      else if(this.monitoringFrequencyData.frequency_reason == 'Acute hospital ED' || this.monitoringFrequencyData.frequency_reason == 'Extended leave' || this.monitoringFrequencyData.frequency_reason == 'AWOL' || this.monitoringFrequencyData.frequency_reason == 'Not appropriate for electronic EWS, alternative paper EWS chart in use') {
        this.monitoringFrequencyData.frequency_entered = null;
        this.monitoringFrequencyData.frequencyunit_entered = null;
        this.monitoringFrequencyData.isstop = true;
        this.monitoringFrequencyData.observationfrequency = null;
      }
      else {
        if(this.monitoringFrequencyData.frequency_reason != '' && this.monitoringFrequencyData.frequency_reason != 'null') {
          if(this.isMARSILOW()) {
          }
          else if((this.monitoringFrequencyData.NEWS2Score == undefined && this.monitoringFrequencyData.NEWS2Score.score == null && this.monitoringFrequencyData.NEWS2Score.score != 0)) {
            this.validationMaxHours = 12;
            this.validationMaxUnit = 'hours';
          }
          else {
            this.validationMaxHoursText = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequency_entered: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxHours = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.observationfrequency: this.defaultMonitoringFrequency.defaultMonitoringFrequencyValue;
            this.validationMaxUnit = this.monitoringFrequencyData.NEWS2Score ? this.monitoringFrequencyData.NEWS2Score.frequencyunit_entered:this.defaultMonitoringFrequency.defaultMonitoringFrequencyUnit;
          }
        }
       
      }
    }
    
    // if(this.env == 'mental_healthcare' && this.monitoringFrequencyData && this.monitoringFrequencyData.frequency_reason == "null") {
    //   this.disableSubmit = true;
    // }
    // else {
    //   this.disableSubmit = false;
    // }
  }

  isNEWS2LOW() {
    if(!this.monitoringFrequencyData.NEWS2Score) {
      return true;
    }
    else if(!this.monitoringFrequencyData.NEWS2Score.score) {
        return true;
    }
    else if(this.monitoringFrequencyData.NEWS2Score.guidance.split(" ")[0] == 'LOW') {
      return true;
    }
    return false;
  }

  isPEWSLOW() {
    if(!this.monitoringFrequencyData.NEWS2Score) {
      return true;
    }
    else if(!this.monitoringFrequencyData.NEWS2Score.guidance) {
        return true;
    }
    else if(this.monitoringFrequencyData.NEWS2Score.guidance.split(" ")[0] == 'LOW' || this.monitoringFrequencyData.NEWS2Score.guidance.split(" ")[0] == 'ZERO') {
      return true;
    }
    return false;
  }
  isMEWSLOW() {
    if(!this.monitoringFrequencyData.NEWS2Score) {
      return true;
    }
    else if(!this.monitoringFrequencyData.NEWS2Score.guidance) {
        return true;
    }
    else if(this.monitoringFrequencyData.NEWS2Score.guidance.split(" ")[0] == 'LOW') {
      return true;
    }
    return false;
  }
  isMARSILOW() {
    if(!this.monitoringFrequencyData.NEWS2Score) {
      return true;
    }
    else if(!this.monitoringFrequencyData.NEWS2Score.guidance) {
        return true;
    }
    else if(this.monitoringFrequencyData.NEWS2Score.guidance.split(" ")[0] == 'LOW' || this.monitoringFrequencyData.NEWS2Score.guidance.split(" ")[0] == 'NO') {
      return true;
    }
    return false;
  }

  async viewHistory() {
    if(this.showHistoryModal) {
      this.showHistoryModal = false;
    }
    else {
      this.showHistoryModal = true;   
    }
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

  receivehistoryViewerData(data) {

    if(data.clickedAction == "showHistory"){
      let Record= this.GetobservationmonitoringfrequencyDetail.find(x=>x.observationevent_id == data.observationevent_id)
      if(Record) {
        this.selectedObsMonitoringFrequency = JSON.parse(JSON.stringify(Record));
        this.RecordHistory= this.selectedObsMonitoringFrequency.__monitoringfrequencyhistory;
        this.RecordHistory.sort((a, b) => new Date(b._createddate).getTime() - new Date(a._createddate).getTime());
        this.RecordHistory.forEach(element => {
          if(element.ispause){
            element.frequency_entered = 'Paused'
          }
          else if(element.isstop) {
            element.frequency_entered = 'Monitoring Stopped'
          }
          else if(element.monitoringnotrequired) {
            element.frequency_entered = 'Regular Monitoring not required'
          }
          else {
            element.frequency_entered = (element.frequency_entered + ' ' + element.frequencyunit_entered)
          }
        });
        this.showEditHistory = true;
      }
      
    }
    else{
    let Record= this.GetobservationmonitoringfrequencyDetail.find(x=>x.observationevent_id == data.observationevent_id)
    if(Record) {
      this.selectedObsMonitoringFrequency = JSON.parse(JSON.stringify(Record));
      this.selectedObsMonitoringFrequency.reasonforamend = "Entered in error";
      this.editMonitoringFrequencyData = {
            'frequency_entered': this.selectedObsMonitoringFrequency.__monitoringfrequency.frequency_entered,
            'frequencyunit_entered': this.selectedObsMonitoringFrequency.__monitoringfrequency.frequencyunit_entered,
            'frequency_reason': this.selectedObsMonitoringFrequency.__monitoringfrequency.frequency_reason,
            'frequency_reason_other':this.selectedObsMonitoringFrequency.__monitoringfrequency.frequency_reason_other,
            'ispause': this.selectedObsMonitoringFrequency.__monitoringfrequency.ispause,
            'isstop': this.selectedObsMonitoringFrequency.__monitoringfrequency.isstop,
            'monitoringnotrequired': this.selectedObsMonitoringFrequency.__monitoringfrequency.monitoringnotrequired
          };
      this.showEditModal = true;
    }
    
  }
    
  }

  saveEditorDelete(action: string) {
    if(this.monitoringFrequencyData.frequency_reason == 'null')
      { 
        this.showEditError=true;
        return;
      }
      else{
        if(this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == ""){
          this.showEditError=true;
          return;
        }
      }
    let loggedInUser = ""
    let eventcorrelationid = uuidv4();
   
      loggedInUser = this.appService.loggedInUserName
   
    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let newObsEvent =  JSON.parse(JSON.stringify(this.selectedObsMonitoringFrequency));
    newObsEvent.eventcorrelationid = eventcorrelationid
    newObsEvent.isamended = true;

    let EventMonitoring = new ObservationEventMonitoring(this.selectedObsMonitoringFrequency.__monitoringfrequency.observationeventmonitoring_id, newObsEvent.observationevent_id, this.monitoringFrequencyData.monitoringFrequency, null, "false", "false", "null", "null", null, null, eventcorrelationid,
      false, false, false, this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered, this.monitoringFrequencyData.frequency_reason, this.monitoringFrequencyData.frequency_reason_other
      , this.monitoringFrequencyData.ispause, this.monitoringFrequencyData.isstop, this.monitoringFrequencyData.isnews2suggestestedfreq, this.monitoringFrequencyData.observationtype_id, this.monitoringFrequencyData.observationtypetext, false, null, null, this.monitoringFrequencyData.monitoringnotrequired)


    // ---------------------------------------------------

   
    if (action == "Delete") {
      newObsEvent.isdeleted = true;
      newObsEvent.deletedby = loggedInUser
      newObsEvent.reasonfordelete = this.selectedObsMonitoringFrequency.reasonfordelete
      newObsEvent.deletedreasonothertext = this.OthereReason;
      EventMonitoring.isdeleted=true
      EventMonitoring.deletedby=loggedInUser
      EventMonitoring.deletedreasonothertext=this.OthereReason
    }


    //--------------------
    Object.keys(EventMonitoring).map((e) => { if (e.startsWith("_")) delete EventMonitoring[e]; })
      newObsEvent.observationfrequency = EventMonitoring.observationfrequency
    Object.keys(newObsEvent).map((e) => { if (e.startsWith("_")) delete newObsEvent[e]; })


    upsertManager.addEntity('core', "observationeventmonitoring", JSON.parse(JSON.stringify(EventMonitoring)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEvent)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.selectedObsMonitoringFrequency = null;
      this.showEditModal = false;
      this.showDeleteModal = false;
      this.init();
    },
      (error) => {

        console.log(error)

      }
      );

  }

  closeMonitoringFrequencyModal() {
    this.subject.closeModal.next('close modal')
  }

  // setDefaultMonitoringFrequency() {
  //   this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/bv_core_inpatientappointments`, this.appService.createEncounterFilter())      
  //   .subscribe(
  //       encList => {
  //         let encounterData = encList;

  //         let getCurrentEncounterData = encounterData.filter(x => x.encounter_id == this.encounterId);

  //         if(getCurrentEncounterData.length > 0) {
  //           this.apiRequest.getRequest(`${this.appService.baseURI}/GetListByAttribute?synapsenamespace=core&synapseentityname=observationevent&synapseattributename=encounter_id&attributevalue=`+ getCurrentEncounterData[0].encounter_id)      
  //           .subscribe(
  //             response => {
  //               let news2ObservationEvent = [];
  //               let observationEvent = JSON.parse(response);
  //               let admintDate;
  //               let todayDate = moment();
  //               let countDay
  //               let validationMaxHours = 0;
  //               if(observationEvent.length > 0) {
  //                 news2ObservationEvent = observationEvent.filter(x => x.observationtypetext == 'news2' || x.observationtypetext == 'news2frequency')
  //                 news2ObservationEvent.sort((a, b) => new Date(b.datestarted).getTime() - new Date(a.datestarted).getTime());
  //               }
  //               // if(news2ObservationEvent.length > 0) {
  //               //   admintDate = moment(news2ObservationEvent[0].datestarted,'YYYY-MM-DD').toDate();
  //               //   countDay = todayDate.diff(admintDate, 'days');
  //               // }
  //               // else {
  //               //   admintDate = moment(getCurrentEncounterData[0].admitdatetime, 'YYYY-MM-DD').toDate();
  //               //   countDay = todayDate.diff(admintDate, 'days');
  //               // }
                
  //               if(news2ObservationEvent.length > 0) {
  //                 // if(countDay >= 1 && countDay <= 3) {
  //                 //   validationMaxHours = 12
  //                 // }
  //                 // else if(countDay >= 4 && countDay <= 7) {
  //                 //   validationMaxHours = 24
  //                 // }
  //                 // else if(countDay > 8) {
  //                 //   validationMaxHours = 168
  //                 // }
  //                 // else {
  //                 //   validationMaxHours = 0
  //                 // }
                  
  //                 this.defaultMonitoringFrequencyData = {
  //                   'frequency_entered': 12,
  //                   'frequencyunit_entered': 'hours',
  //                   // 'observationevent_id':this.GetobservationmonitoringfrequencyDetail.observationevent_id,
  //                   // 'validationMaxHours': validationMaxHours
  //                 }
  //               }
  //               else {
  //                 this.defaultMonitoringFrequencyData = {
  //                   'frequency_entered': 1,
  //                   'frequencyunit_entered': 'hours',
  //                   // 'observationevent_id':this.GetobservationmonitoringfrequencyDetail.observationevent_id,
  //                   // 'validationMaxHours': validationMaxHours
  //                 }
  //               }
                
  //             });
  //         }
  //         else {
  //           this.defaultMonitoringFrequencyData = {
  //             'frequency_entered': 1,
  //             'frequencyunit_entered': 'hours',
  //             // 'observationevent_id':this.GetobservationmonitoringfrequencyDetail.observationevent_id,
  //             // 'validationMaxHours': validationMaxHours
  //           }
  //         }

  //       });
  // }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  openAdditionalGuidanceModal(){
    this.showAdditionalGuidanceModal = true;
  }

  ChoosenfilterdateChange(value: any): void {
      let selectedDate = moment(value);
      let maxselectedDate = moment(value);
      
      maxselectedDate.set({
        hour: 23,
        minute: 59,
        second: 0,
        millisecond: 0,
      });
      
      selectedDate.set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      
      if (value) {
        this.filteredData = this.historyData.filter(x => moment(x._createddate).isSameOrAfter(selectedDate) && moment(x._createddate).isSameOrBefore(maxselectedDate))
      }
      else {
        this.filteredData = this.historyData;
      }
  
    }

    editAdditionalClinicalGuidance(){
      this.isAmend = true;
      this.showEditButton = false;
      this.guidanceText = this.historyData[0].guidance;
    }

    showAdditionalClinicalGuidanceHistory(){
      if(this.showHistory){
        this.showHistory = false;
      }
      else{
        this.showHistory = true;
      }
      
    }

    saveAdditionalClinicalGuidance(){

      this.personAdditionalGuidance.personadditionalguidance_id = uuidv4();
      this.personAdditionalGuidance.encounter_id = this.appService.encounter.encounter_id;
      this.personAdditionalGuidance.person_id = this.appService.personId;
      this.personAdditionalGuidance.guidance = this.guidanceText.trim();
      this.personAdditionalGuidance.ewsscale = this.appService.currentEWSScale;

      this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=personadditionalguidance", JSON.stringify(this.personAdditionalGuidance))
        .subscribe({
          next: (response) => {
            this.showAdditionalGuidanceModal = false;
            this.isAmend = false;
            this.showHistory = false;
            this.Choosenfilterdate = '';
            this.getAdditionalClinicalGuidanceHistory();
          },
          error: (error) => {
            console.error('Error fetching config:', error);
          }
        })
      );
    }

    getAdditionalClinicalGuidanceHistory(){
      this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/eobs_personadditionalguidancehistory", this.createAdditionalGuidanceFilter())
      .subscribe({
          next: (response) => {
            //this.showAdditionalGuidanceModal = false;
            this.historyData = response;
            this.filteredData = response;

            if(this.historyData.length > 0 && (this.historyData[0].guidance != null || this.historyData[0].guidance.trim() != '')){
              this.showEditButton = true;
            }
            else{
              this.showEditButton = false;
            }
          },
          error: (error) => {
            console.error('Error fetching config:', error);
          }
        })
      );
    }

    createAdditionalGuidanceFilter() {
      let condition = "person_id = @person_id and encounter_id = @encounter_id";
      
      let f = new filters()
      f.filters.push(new filter(condition));
  
      let pm = new filterParams();
      pm.filterparams.push(new filterparam("person_id", this.appService.personId!));
      pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id!));
  
      let select = new selectstatement("SELECT *");
  
      let orderby = new orderbystatement("ORDER BY _sequenceid desc");
  
      let body = [];
      body.push(f);
      body.push(pm);
      body.push(select);
      body.push(orderby);
  
      return JSON.stringify(body);
    }

    closeAdditionalClinicalGuidanceModal(){
      this.showAdditionalGuidanceModal = false;
      this.isAmend = false;
      this.showHistory = false;
      this.Choosenfilterdate = '';
      this.getAdditionalClinicalGuidanceHistory();
    }
    
}
