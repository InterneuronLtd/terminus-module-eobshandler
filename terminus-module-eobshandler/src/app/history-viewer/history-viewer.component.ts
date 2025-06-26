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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import moment from 'moment';
import { SubjectsService } from '../services/subjects.service';

@Component({
  selector: 'app-history-viewer',
  templateUrl: './history-viewer.component.html',
  styleUrls: ['./history-viewer.component.css']
})
export class HistoryViewerComponent implements OnInit {

  showEditModal: boolean = false;
  listObsMonitoringFrequecy: any;
  historyColumn: any;
  Choosenfilterdate:any;
  filterdata: any;

  @Input() set monitoringFrequencyHistoryData (value: any) {
    // console.log('monitoringFrequencyHistoryData',value);
    if(value) {
      this.listObsMonitoringFrequecy = value;
      this.filterdata = this.listObsMonitoringFrequecy;
    }
  }

  @Input() set rowForHistoryViewer (value: any) {
    // console.log('rowForHistoryViewer',value);
    if(value) {
      this.historyColumn = value;
    }

  }

  @Output() historyViewerOutput = new EventEmitter();

  constructor(public subjects: SubjectsService) { }

  ngOnInit(): void {
  }

  openEditModal(editRecord) {
    // console.log('editRecord',editRecord);
    this.showEditModal = true;
    editRecord.clickedAction = 'showEdit';
    this.historyViewerOutput.emit(editRecord);
  }

  openHistoryModal(historyRecord) {
    this.showEditModal = false;
    historyRecord.clickedAction = 'showHistory';
    this.historyViewerOutput.emit(historyRecord);
  }

  ChoosenfilterdateChange(value: Date): void {
    // this.Choosenfilterdate = moment(value,"DD/MM/YYYY");
    
    let selectedDate= moment(value);
    let maxselectedDate= moment(value);
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
   if(value){
     this.filterdata= this.listObsMonitoringFrequecy.filter(x=>moment(x.datestarted).isSameOrAfter(selectedDate) && moment(x.datestarted).isSameOrBefore(maxselectedDate) )
    }
   else{
     this.filterdata= this.listObsMonitoringFrequecy;
   }
    
   }

   showReasonAlert(reason){
    this.subjects.showReasonModal.next(reason);
   }

}
