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
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import moment from 'moment';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';
import { SubjectsService } from '../services/subjects.service';
import { catchError, of, Subscription } from 'rxjs';
import { filter, filterparam, filterParams, filters, orderbystatement, selectstatement } from '../models/filter.model';

declare var bootstrap: any; // Add this line

@Component({
  selector: 'app-food-and-fluid-history-viewer',
  templateUrl: './food-and-fluid-history-viewer.component.html',
  styleUrl: './food-and-fluid-history-viewer.component.css'
})
export class FoodAndFluidHistoryViewerComponent {
  showEditModal: boolean = false;
  listObsMonitoringFrequecy: any[] = [];
  historyData: any[] = [];
  historyColumns: any;
  Choosenfilterdate:any;
  filterdata: any[] = [];
  tempData: any[] = [];
  data: any[] = [];
  subscriptions: Subscription = new Subscription();

  historyModalInstance: any;
  isHistoryModalOpen: boolean = false;

  runningTotals: any[] = [];

  @Output() historyViewerOutput = new EventEmitter();

  constructor(public apiRequestService: ApirequestService, public appService: AppService, private subjects: SubjectsService) { 
    this.subscriptions.add(
      this.subjects.personIdChange.subscribe(() => {
        this.getData();
      })
    );

    this.subscriptions.add(
      this.subjects.refreshHistoryData.subscribe(() => {
        this.getData();
      })
    );
  }

  ngOnInit() {
    this.fetchConfigData();
    this.getData();
 }

  ngAfterViewInit(): void {

    const historyModalElement = document.getElementById('historyModal');

    if(historyModalElement){
      this.historyModalInstance = new bootstrap.Modal(historyModalElement, {
        backdrop: 'static', // Keeps the backdrop static
        keyboard: false // Disables closing with ESC
      });
    }

    historyModalElement?.addEventListener('hidden.bs.modal', () => {
        // Remove any existing backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    });
  }

  fetchConfigData(){
    // this.apiRequestService.getRequest("assets/config/eobshandlerConfig.json").pipe(
    //   catchError(error => {
    //       console.error('Error fetching config:', error);
    //       return of(null); // or an empty object
    //   })
    // ).subscribe(data => {
      this.historyColumns = this.appService.appConfig.HistoryColumns;
    // });
  }

  getData() {
    this.subscriptions.add(
      this.apiRequestService.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/foodandfluid_foodandfluidobservationhistorydata", this.createFoodFluidFilter())
        .subscribe((response) => {
          this.listObsMonitoringFrequecy = response;
          //console.log(this.listObsMonitoringFrequecy);
          let changed: boolean = false;
          
          this.filterdata = this.listObsMonitoringFrequecy?.map((item) => {
            
            return {
              ...item,
              foodtakenhtml: JSON.parse(item.foodtaken)?.map((x: any) => (x.foodItemValue + ' - ' + x.foodItemConsumedValue)),
              fluidtakenhtml: JSON.parse(item.fluidtaken)?.map((x:any) => (x.fluidItemConsumedValue + ' ml - ' + x.fluidItemValue)),
              recordingreminder: item.frequencyoptionselected === 'Time' ? item.frequencyentered + ' ' + item.frequencyunitentered : 'Monitoring Stopped',
              fluidItemConsumedValue: '',
              isLatest: (item._recordstatus == 1 && !changed) ? (changed = true, true) : false
            };
          });
          
          this.tempData = this.filterdata?.map(item => {
            return {
              ...item
            }
          });

          this.getRunningTotalBasedOnDateStarted(this.tempData[this.tempData.length - 1]?.datestarted);

        })
    );
  }

  // getFluidTotals() {
  //   return this.tempData.map(obs => {
  //     const fluids = JSON.parse(obs.fluidtaken);
  //     return fluids.reduce((sum:any, fluid:any) => sum + (parseFloat(fluid.fluidItemConsumedValue) || 0), 0);
  //   });
  // }

  // // Method to get running total
  // getRunningTotal() {
  //   console.log('this.tempData: ', this.tempData)
  //   const totals = this.getFluidTotals();
  //   const runningTotals = [];
  //   let currentRunningTotal = 0;

  //   for (let i = totals.length - 1; i >= 0; i--) {
  //     if (this.tempData[i]._recordstatus !== 2) {
  //       currentRunningTotal += totals[i];
  //     }
  //     runningTotals[i] = currentRunningTotal;
  //   }
  //   return runningTotals;
  // }

  getRunningTotalBasedOnDateStarted(startDate: Date) {
    this.runningTotals = [];
    const startMoment = moment(startDate).startOf('day').set({ hour: this.appService.startTime });  // Start at 7 AM on startDate
    //const endMoment = moment(endDate).startOf('day').set({ hour: 7 }).add(1, 'day');  // End at 7 AM on endDate

    const isBeforeSevenAM = moment(startDate).isBefore(startMoment);

    const startDateTime = isBeforeSevenAM 
    ? moment(startDate).subtract(1, 'days').set({ hour: this.appService.startTime, minute: 0, second: 0, millisecond: 0 })
    : startMoment; 
    
    let currentMoment = startDateTime.clone();  // Track the current 7 AM window
    let currentRunningTotal = 0;  // Initialize running total for the current day
    const runningTotals = [];  // Array to store the results

    let sortedData = this.tempData.map(item => {
      return {
        ...item
      }
    });
  
    // First, sort the data by `datestarted`
    sortedData = sortedData.sort((a, b) => moment(a.datestarted).diff(moment(b.datestarted)));
    
    // Iterate through each observation (now sorted by datestarted)
    sortedData.forEach((obs, i) => {
      const obsMoment = moment(obs.datestarted);  // Convert datestarted to a Moment.js object
  
      // Reset running total if the observation moves to the next day (after 7 AM)
      while (obsMoment.isSameOrAfter(currentMoment.clone().add(1, 'day'))) {
        currentMoment.add(1, 'day');  // Move to the next day
        currentRunningTotal = 0;  // Reset the running total for the new day
      }
  
      // Check if the observation is within the current 7 AM to 7 AM window
      if (obsMoment.isBetween(currentMoment, currentMoment.clone().add(1, 'day'), null, '[)')) {
        const fluids = JSON.parse(obs.fluidtaken);  // Parse fluid intake data
        const totalFluids = fluids?.reduce((sum: any, fluid: any) => sum + (parseFloat(fluid.fluidItemConsumedValue) || 0), 0);
  
        if (obs._recordstatus !== 2) {  // Only add to running total if the entry is not deleted
          currentRunningTotal += totalFluids;
        }
        else{
          currentRunningTotal = currentRunningTotal;
        }
  
        runningTotals.push({
          currentRunningTotal
        });
      }
    });
  
    this.runningTotals = runningTotals.reverse();

    //return runningTotals.reverse();  // Return the results
  }

  editFoodAndFluidObservation(editRecord: any) {
    this.historyViewerOutput.emit(editRecord);
  }

  openHistoryModal(historyRecord: any) {
    if (!this.isHistoryModalOpen) {
      this.getHistoryData(historyRecord.foodfluidobservation_id);
      this.isHistoryModalOpen = true;
      this.historyModalInstance.show();
    }
  }

  hideHistoryModal(){
    this.historyModalInstance.hide();
    this.historyModalInstance._element.addEventListener('hidden.bs.modal', () => {
      this.isHistoryModalOpen = false; // Reset the flag
    });
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
      this.filterdata = this.tempData.filter(x => moment(x.datestarted).isSameOrAfter(selectedDate) && moment(x.datestarted).isSameOrBefore(maxselectedDate))
    }
    else {
      this.filterdata = this.tempData;
    }

  }

  createFoodFluidFilter() {
    let condition = "person_id = @person_id and encounter_id = @encounter_id";
    
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("person_id", this.appService.personId!));
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id!));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY datestarted desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.unsubscribe();
  }

  getHistoryData(foodfluidobservation_id: string){
    this.subscriptions.add(
      this.apiRequestService.getRequest(this.appService.baseURI + "/GetObjectHistory?synapsenamespace=core&synapseentityname=foodfluidobservation&id=" + foodfluidobservation_id)
        .subscribe((response) => {
          this.historyData = JSON.parse(response);
  
          this.data = this.historyData.reverse().map(item => {
  
            return {
              ...item,
              foodtakenhtml: JSON.parse(item.foodtaken).map((x: any) => (x.foodItemValue + ' - ' + x.foodItemConsumedValue)),
              fluidtakenhtml: JSON.parse(item.fluidtaken).map((x:any) => (x.fluidItemConsumedValue + ' ml - ' + x.fluidItemValue)),
              recordingreminder: item.frequencyoptionselected === 'Time' ? item.frequencyentered + ' ' + item.frequencyunitentered : 'Monitoring Stopped',
              fluidItemConsumedValue: ''
            };
          });
          
        })
    );
  }

  getObservationFluidTotals() {
    return this.data.map(obs => {
      const fluids = JSON.parse(obs.fluidtaken);
      const total = fluids.reduce((sum:any, fluid:any) => sum + (parseFloat(fluid.fluidItemConsumedValue) || 0), 0);
      return total;
    });
  }

  showReasonAlert(reason){
    this.subjects.showReasonModal.next(reason);
   }
}
