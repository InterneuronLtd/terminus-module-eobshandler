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
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { ApirequestService } from '../services/apirequest.service';
import { FoodFluidObservation } from '../models/foodFluidObservation.model';
import { AppService, BadgeNames } from '../services/app.service';
import { v4 as uuidv4 } from 'uuid';
import { catchError, map, Observable, of, Subscription } from 'rxjs';
import { filter, filterparam, filterParams, filters, orderbystatement, selectstatement } from '../models/filter.model';
import { SubjectsService } from '../services/subjects.service';
import moment from 'moment';

declare var bootstrap: any; // Add this line

@Component({
  selector: 'app-food-and-fluid',
  templateUrl: './food-and-fluid.component.html',
  styleUrl: './food-and-fluid.component.css',
})

export class FoodAndFluidComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup;
  editForm: FormGroup;
  foodItemDropdownOptions: any[] = [];
  passedUrineDropdownOptions: any[] = [];
  recordingReminderDropdownOptions: any[] = [];
  reasonDropdownValues: any[] = [];
  pleaseSelectDropdownValues: any[] = [];
  minutesDropdownValues: any[] = [];
  hoursDropdownValues: any[] = [];
  daysDropdownValues: any[] = [];
  monitoringDropdownValues: any[] = [];
  //defaultFrequency: string = '';
  //defaultFrequencyUnit: string = '';
  reasonDropdownOptions: any[] = [];
  reasonForDeleteDropdownOptions: any[] = [];
  showOtherReasonTxtbx: boolean = false;
  showEditOtherReasonTxtbx: boolean = false;
  foodFluidObservation = new FoodFluidObservation();
  subscriptions: Subscription = new Subscription();
  formModalInstance: any;
  isFormModalOpen: boolean = false;
  //isEditMode: boolean = false;
  observationDateTime: any;
  successModalInstance: any;
  isSuccessModalOpen: boolean = false;
  foodfluidobservation_id: string = '';
  showEditReasonOtherTxtbx: boolean = false;
  showDeleteReasonOtherTxtbx: boolean = false;
  deleteModalInstance: any;
  isDeleteModalOpen: boolean = false;
  editModalInstance: any;
  isEditModalOpen: boolean = false;
  reasonForDelete: string = 'EnteredInError';
  reasonForDeleteOther: string = '';
  dataToUpdate:any;
  filterdata: any[] = [];
  recordDate = new Date();
  
  showHistory: boolean = false;
  today = new Date();
  mindate = new Date();
  maxTime = new Date();
  minTime = new Date();

  showMonitoringFreq: boolean = false;
  showSubmitButton: boolean = false;
  showEditSubmitButton: boolean = false;
  showDeleteSubmitButton: boolean = false;
  isSubmitted: boolean = false;
  isEditSubmitted: boolean = false;

  show7DaysValidationError: boolean = false;
  passedUrineError: boolean = false;
  editPassedUrineError: boolean = false;

  createdOn:any;
  createdBy: string;

  monitoringFrequencyLbl: string = '';
  monitoringFrequencyReasonLbl: string = '';

  constructor(public fb: FormBuilder, public apiRequestService: ApirequestService, public appService: AppService, private subjects: SubjectsService) {
    this.form = this.fb.group({
      foodControls: this.fb.array([]), 
      fluidControls: this.fb.array([]), 
      observationDateTime: [new Date(), [Validators.required]],
      passedUrineValue: [''],
      recordReminderOption: ['StopMonitoring', [Validators.required]],
      recordReminderTxtValue: ['', [Validators.required]],
      recordReminderDrpValue: ['', [Validators.required]],
      reasonValue: ['Other', [Validators.required]],
      reasonOther: ['Monitoring not started'],
      reasonForEdit: ['EnteredInError', [Validators.required]],
      reasonForEditOther: ['']
    });

    //this.form.get('recordReminderTxtValue')?.setAsyncValidators(this.numberValidator.bind(this));
    this.form.get('recordReminderOption')?.valueChanges.subscribe((value) => {
      this.setReminderValidators(value);
    });

    this.setReminderValidators(this.form.get('recordReminderOption')?.value);

    this.editForm = this.fb.group({
      editFoodControls: this.fb.array([]), 
      editFluidControls: this.fb.array([]), 
      observationDateTime: [new Date(), [Validators.required]],
      passedUrineValue: [''],
      recordReminderOption: ['StopMonitoring', [Validators.required]],
      recordReminderTxtValue: ['', [Validators.required]],
      recordReminderDrpValue: ['', [Validators.required]],
      reasonValue: ['Other', [Validators.required]],
      reasonOther: ['Monitoring not started'],
      reasonForEdit: ['EnteredInError', [Validators.required]],
      reasonForEditOther: ['']
    });

    //this.editForm.get('recordReminderTxtValue')?.setAsyncValidators(this.numberValidator.bind(this));
    this.editForm.get('recordReminderOption')?.valueChanges.subscribe((value) => {
      this.setEditReminderValidators(value);
    });

    this.setEditReminderValidators(this.editForm.get('recordReminderOption')?.value);

    this.initialiseDateTime();
  }

  ngAfterViewInit(): void {
    const foodAndFluidModalElement = document.getElementById('foodAndFluidModal');
    
    if(foodAndFluidModalElement){
      this.formModalInstance = new bootstrap.Modal(foodAndFluidModalElement, {
        backdrop: 'static', // Keeps the backdrop static
        keyboard: false // Disables closing with ESC
      });
    }

    foodAndFluidModalElement?.addEventListener('hidden.bs.modal', () => {
        // Remove any existing backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    });

    const successModalElement = document.getElementById('foodAndFluidSuccessModal');
    
    if(successModalElement){
      this.successModalInstance = new bootstrap.Modal(successModalElement, {
        backdrop: 'static', // Keeps the backdrop static
        keyboard: false // Disables closing with ESC
      });
    }

    successModalElement?.addEventListener('hidden.bs.modal', () => {
        // Remove any existing backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    });

    const deleteModalElement = document.getElementById('foodAndFluidDeleteModal');

    if(deleteModalElement){
      this.deleteModalInstance = new bootstrap.Modal(deleteModalElement, {
        backdrop: 'static', // Keeps the backdrop static
        keyboard: false // Disables closing with ESC
      });
    }

    deleteModalElement?.addEventListener('hidden.bs.modal', () => {
        // Remove any existing backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    });

    const editFoodAndFluidModalElement = document.getElementById('editFoodAndFluidModal');

    if(editFoodAndFluidModalElement){
      this.editModalInstance = new bootstrap.Modal(editFoodAndFluidModalElement, {
        backdrop: 'static', // Keeps the backdrop static
        keyboard: false // Disables closing with ESC
      });
    }

    editFoodAndFluidModalElement?.addEventListener('hidden.bs.modal', () => {
        // Remove any existing backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    });

    this.showFormModal();
  }

  ngOnInit(){
    this.fetchConfigData();
    this.getData();
    //this.addFluidControl();
    this.updateValidation();
    this.updateOtherValidation();

    this.initialiseDateTime();
    this.showMonitoringFreq = true;
    this.showSubmitButton = true;
    this.showDeleteSubmitButton = true;
    
    if(this.appService.AuthoriseAction('eobs_setmonitoring_foodandfluid')){
      this.form.get('recordReminderOption').enable();
      this.form.get('recordReminderTxtValue').enable();
      this.form.get('recordReminderDrpValue').enable();
      this.form.get('reasonValue').enable();
      this.form.get('reasonOther').enable();
    }
    else {
      this.form.get('recordReminderOption').disable();
      this.form.get('recordReminderTxtValue').disable();
      this.form.get('recordReminderDrpValue').disable();
      this.form.get('reasonValue').disable();
      this.form.get('reasonOther').disable();
    }

  }

  initialiseDateTime(){
    //this.mindate = new Date(this.appService.encounter.admitdatetime);
    this.mindate = new Date()
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;
    this.minTime.setMinutes(this.minTime.getMinutes() , 0, 0)
    
    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
  }

  fetchConfigData(){
    // this.apiRequestService.getRequest("assets/config/eobshandlerConfig.json").pipe(
    //   catchError(error => {
    //       console.error('Error fetching config:', error);
    //       return of(null); // or an empty object
    //   })
    // ).subscribe(data => {
      this.foodItemDropdownOptions = this.appService.appConfig.FoodItemDropdownValues;
      this.passedUrineDropdownOptions = this.appService.appConfig.PassedUrineDropdownValues;
      this.recordingReminderDropdownOptions = this.appService.appConfig.RecordingReminderDropdownValues;
      this.reasonDropdownValues = this.appService.appConfig.ReasonDropdownValues;
      this.pleaseSelectDropdownValues = this.appService.appConfig.FoodAndFluidPleaseSelectDrpValues;
      this.minutesDropdownValues = this.appService.appConfig.FoodAndFluidMinutesDrpValues;
      this.hoursDropdownValues = this.appService.appConfig.FoodAndFluidHoursDrpValues;
      this.daysDropdownValues = this.appService.appConfig.FoodAndFluidDaysDrpValues;
      //this.defaultFrequency = this.appService.appConfig.FoodAndFluidDefaultFrequency;
      //this.defaultFrequencyUnit = this.appService.appConfig.FoodAndFluidDefaultFrequencyUnit;
      this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes("StopMonitoring"));
      this.reasonForDeleteDropdownOptions = this.appService.appConfig.ReasonForDeleteDropdownValues;
      this.appService.startTime = this.appService.appConfig.StartTime;
      //this.addFoodControl();
    // });
  }

  get foodControls(): FormArray {
    return this.form.get('foodControls') as FormArray;
  }

  get fluidControls(): FormArray {
    return this.form.get('fluidControls') as FormArray;
  }

  get editFoodControls(): FormArray {
    return this.editForm.get('editFoodControls') as FormArray;
  }

  get editFluidControls(): FormArray {
    return this.editForm.get('editFluidControls') as FormArray;
  }

  addFoodControl() {
    const controlGroup = this.fb.group({
      foodItemValue: [''],
      foodItemConsumedValue: ['All']
    });
    this.foodControls.push(controlGroup);
  }

  removeFoodControl(index: number) {
    this.foodControls.removeAt(index);
  }

  addFluidControl() {
    const controlGroup = this.fb.group({
      fluidItemValue: [''],
      fluidItemConsumedValue: ['']
    });

    let isUpdating = false;
     // Watch for changes in fluidItemValue and conditionally apply the required validator to fluidItemConsumedValue
    controlGroup.get('fluidItemValue')?.valueChanges.subscribe(value => {
      const fluidItemConsumedValueControl = controlGroup.get('fluidItemConsumedValue');
      if (isUpdating) return; // Prevent infinite loop
      
      isUpdating = true; // Set flag to prevent further updates
      
      if (value?.trim()) {
        fluidItemConsumedValueControl?.setValidators([Validators.required]);
      } else {
        fluidItemConsumedValueControl?.clearValidators();
      }

      // Update validity only if the control is not being updated already
      fluidItemConsumedValueControl?.updateValueAndValidity();
      
      isUpdating = false; // Reset flag after update
    });

    // Watch for changes in fluidItemConsumedValue and conditionally apply the required validator to fluidItemValue
    controlGroup.get('fluidItemConsumedValue')?.valueChanges.subscribe(value => {
      const fluidItemValueControl = controlGroup.get('fluidItemValue');
      if (isUpdating) return; // Prevent infinite loop

      isUpdating = true; // Set flag to prevent further updates

      if (value) {
        fluidItemValueControl?.setValidators([Validators.required, this.noWhitespaceValidator]);
      } else {
        fluidItemValueControl?.clearValidators();
      }

      // Update validity only if the control is not being updated already
      fluidItemValueControl?.updateValueAndValidity();
      
      isUpdating = false; // Reset flag after update
    });

    this.fluidControls.push(controlGroup);

    controlGroup.get('fluidItemConsumedValue')?.setAsyncValidators(this.numberValidator.bind(this));
  }

  removeFluidControl(index: number) {
    this.fluidControls.removeAt(index);
  }

  addEditFoodControl() {
    const controlGroup = this.fb.group({
      foodItemValue: [''],
      foodItemConsumedValue: ['All']
    });
    this.editFoodControls.push(controlGroup);
  }

  removeEditFoodControl(index: number) {
    this.editFoodControls.removeAt(index);
  }

  addEditFluidControl() {
    const controlGroup = this.fb.group({
      fluidItemValue: [''],
      fluidItemConsumedValue: ['']
    });

    let isUpdating = false;
     // Watch for changes in fluidItemValue and conditionally apply the required validator to fluidItemConsumedValue
    controlGroup.get('fluidItemValue')?.valueChanges.subscribe(value => {
      const fluidItemConsumedValueControl = controlGroup.get('fluidItemConsumedValue');
      if (isUpdating) return; // Prevent infinite loop
      
      isUpdating = true; // Set flag to prevent further updates
      
      if (value) {
        fluidItemConsumedValueControl?.setValidators([Validators.required]);
      } else {
        fluidItemConsumedValueControl?.clearValidators();
      }

      // Update validity only if the control is not being updated already
      fluidItemConsumedValueControl?.updateValueAndValidity();
      
      isUpdating = false; // Reset flag after update
    });

    // Watch for changes in fluidItemConsumedValue and conditionally apply the required validator to fluidItemValue
    controlGroup.get('fluidItemConsumedValue')?.valueChanges.subscribe(value => {
      const fluidItemValueControl = controlGroup.get('fluidItemValue');
      if (isUpdating) return; // Prevent infinite loop

      isUpdating = true; // Set flag to prevent further updates

      if (value) {
        fluidItemValueControl?.setValidators([Validators.required, this.noWhitespaceValidator]);
      } else {
        fluidItemValueControl?.clearValidators();
      }

      // Update validity only if the control is not being updated already
      fluidItemValueControl?.updateValueAndValidity();
      
      isUpdating = false; // Reset flag after update
    });

    this.editFluidControls.push(controlGroup);

    controlGroup.get('fluidItemConsumedValue')?.setAsyncValidators(this.numberValidator.bind(this));
  }

  removeEditFluidControl(index: number) {
    this.editFluidControls.removeAt(index);
  }

  recordReminderChange(event: any){
    this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes(event.target.value));
    this.form.get('reasonValue')?.reset('');
    this.showOtherReasonTxtbx = false;
    this.form.get('reasonOther')?.reset('');
    this.updateValidation();
  }

  recordEditReminderChange(event: any){
    this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes(event.target.value));
    this.editForm.get('reasonValue')?.reset('');
    this.showEditOtherReasonTxtbx = false;
    this.editForm.get('reasonOther')?.reset('');
    this.updateEditValidation();
  }

  submit() {
    this.isSubmitted = true;
    
    if (this.fluidControlsHaveInvalidValue()) {
      return; 
    }

    if(!this.appService.AuthoriseAction('eobs_setmonitoring_foodandfluid')) {
      let filteredFoodItems = this.form.value.foodControls.length > 0 ? this.form.value.foodControls.filter(item => item.foodItemValue.trim() != '') : [];
      // this.foodFluidObservation.foodtaken = JSON.stringify(filteredFoodItems);

      let filteredFluidItems = this.form.value.fluidControls.length > 0 ? this.form.value.fluidControls.filter(item => item.fluidItemConsumedValue.trim() != '') : [];
      // this.foodFluidObservation.fluidtaken = JSON.stringify(filteredFluidItems);

      if(filteredFoodItems.length == 0 && filteredFluidItems.length == 0 && (this.form.getRawValue()["passedUrineValue"] == '' || this.form.getRawValue()["passedUrineValue"] == null || this.form.getRawValue()["passedUrineValue"] == 'null' || this.form.getRawValue()["passedUrineValue"] == undefined)) {
        this.passedUrineError = true;
        return;
      }
      else {
        this.passedUrineError = false;
      }
    }

    if(this.form.value.recordReminderOption == 'Time' && (this.form.value.recordReminderTxtValue != '' || this.form.value.recordReminderTxtValue != null || this.form.value.recordReminderTxtValue != undefined)){
      this.show7DaysValidationError = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.form.value.recordReminderTxtValue, this.form.value.recordReminderDrpValue);
      
      if(this.show7DaysValidationError){
        return;
      }
    }
    else{
      this.show7DaysValidationError = false;
    }

    if(this.form.valid){
      this.showSubmitButton = false;
      this.foodFluidObservation = new FoodFluidObservation();
      this.foodFluidObservation.foodfluidobservation_id = uuidv4();

      let filteredFoodItems = this.form.value.foodControls.length > 0 ? this.form.value.foodControls.filter(item => item.foodItemValue.trim() != '') : [];
      this.foodFluidObservation.foodtaken = JSON.stringify(filteredFoodItems);

      let filteredFluidItems = this.form.value.fluidControls.length > 0 ? this.form.value.fluidControls.filter(item => item.fluidItemConsumedValue.trim() != '') : [];
      this.foodFluidObservation.fluidtaken = JSON.stringify(filteredFluidItems);

      this.foodFluidObservation.datestarted = this.getDateTimefromForm(this.form.getRawValue()["observationDateTime"]);
      this.foodFluidObservation.datefinished = this.getDateTimefromForm(this.form.getRawValue()["observationDateTime"]);
      this.foodFluidObservation.passedurine = this.form.value.passedUrineValue;
      this.foodFluidObservation.frequencyunitentered = this.form.getRawValue()["recordReminderOption"] == 'Time' ? this.form.getRawValue()["recordReminderDrpValue"] : null;
      this.foodFluidObservation.frequencyentered = this.form.getRawValue()["recordReminderOption"] == 'Time' ? this.form.getRawValue()["recordReminderTxtValue"] : null;
      this.foodFluidObservation.frequencyreason = this.form.getRawValue()["reasonValue"];
      this.foodFluidObservation.frequencyreasonother = this.form.getRawValue()["reasonOther"];
      this.foodFluidObservation.frequencyoptionselected = this.form.getRawValue()["recordReminderOption"];
      this.foodFluidObservation.person_id = this.appService.personId;
      this.foodFluidObservation.encounter_id = this.appService.encounter.encounter_id;
      this.foodFluidObservation.createdon = this.appService.getDateTimeinISOFormat(new Date());
      this.foodFluidObservation.lastmodifiedon = this.appService.getDateTimeinISOFormat(new Date());
      this.foodFluidObservation.createdby = this.appService.loggedInUserName;
      this.foodFluidObservation.lastmodifiedby = this.appService.loggedInUserName;
      this.foodFluidObservation.isedited = false;
  
      if(this.form.getRawValue()["recordReminderOption"] == 'Time' && this.form.getRawValue()["recordReminderDrpValue"] == 'hours'){
        this.foodFluidObservation.observationfrequency = this.form.getRawValue()["recordReminderTxtValue"];
      }
      else if(this.form.getRawValue()["recordReminderOption"] == 'Time' && this.form.getRawValue()["recordReminderDrpValue"] == 'minutes'){
        this.foodFluidObservation.observationfrequency = (this.form.getRawValue()["recordReminderTxtValue"] / 60).toString();
      }
      else if(this.form.getRawValue()["recordReminderOption"] == 'Time' && this.form.getRawValue()["recordReminderDrpValue"] == 'days'){
        this.foodFluidObservation.observationfrequency = (this.form.getRawValue()["recordReminderTxtValue"] * 24).toString();
      }
      else {
        this.foodFluidObservation.observationfrequency = null;
      }
  
      //this.foodFluidObservation.reasonforedit = this.foodfluidobservation_id != '' ? this.form.value.reasonForEdit : '';
      //this.foodFluidObservation.reasonforeditother = this.form.value.reasonForEdit == 'Other' ? this.form.value.reasonForEditOther : '';
      
      this.foodFluidObservation.monitoringnotrequired = this.form.getRawValue()["recordReminderOption"] == 'Time' ? false : true;
  
      this.recordDate = this.foodFluidObservation.datestarted;
  
      this.subscriptions.add(this.apiRequestService.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=foodfluidobservation", JSON.stringify(this.foodFluidObservation))
        .subscribe({
          next: (response) => {
            this.showSubmitButton = true;
            this.isSubmitted = false;
            this.show7DaysValidationError = false;
            this.subjects.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.FoodAndFluid);
            this.subjects.refreshHistoryData.next();
            
            this.hideFormModal();
            this.showSuccessModal();

          },
          error: (error) => {
            console.error('Error fetching config:', error);
          }
        })
      );
    }
    
  }

  getDateTimefromForm(dateTime: any): string {
    var time = new Date(dateTime);
    var hours = time.getHours();
    var s = time.getSeconds();
    var m = time.getMilliseconds()
    var minutes = time.getMinutes();
    var date = new Date(dateTime);
    date.setHours(hours);
    date.setMinutes(minutes);
    //date.setSeconds(s);
    //date.setMilliseconds(m);
    //this.appService.logToConsole(date);
    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let dt = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();
    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (dt < 10 ? "0" + dt : dt) + "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));
    //this.appService.logToConsole(returndate);
    return returndate;
  }

  resetForm(): void {
    this.form.reset({
      foodControls: [],
      fluidControls: [],
      observationDateTime: new Date(),
      passedUrineValue: '',
      recordReminderOption: 'StopMonitoring',
      recordReminderTxtValue: '',
      recordReminderDrpValue: '',
      reasonValue: 'Other',
      reasonOther: 'Monitoring not started',
      reasonForEdit: 'EnteredInError',
      reasonForEditOther: ''
    });

    if(this.foodControls.length > 0){
      this.foodControls.clear();
    }

    if(this.fluidControls.length > 0){
      this.fluidControls.clear();
    }

    this.addFoodControl();

    this.addFluidControl();

    this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes('StopMonitoring'));

    //this.isEditMode = false;
    this.showOtherReasonTxtbx = false;
    this.showEditReasonOtherTxtbx = false;
    this.showDeleteReasonOtherTxtbx = false;
    this.showHistory = false;
    this.showMonitoringFreq = true;
    this.showSubmitButton = true;
    this.showDeleteSubmitButton = true;

    this.showEditOtherReasonTxtbx = false;
    this.showEditReasonOtherTxtbx = false;
    this.showEditSubmitButton = false;
    this.isEditSubmitted = false;
    this.show7DaysValidationError = false;

    this.passedUrineError = false;
    this.editPassedUrineError = false;

    this.isSubmitted = false;
  }

  reasonChange(event: any){
    if(event.target.value == 'Other'){
      this.showOtherReasonTxtbx = true;
      this.updateValidation();
    }
    else {
      this.showOtherReasonTxtbx = false;
      this.form.get('reasonOther')?.reset('');
      this.updateValidation();
    }
  }

  reasonEditChange(event: any){
    if(event.target.value == 'Other'){
      this.showEditOtherReasonTxtbx = true;
      this.updateEditValidation();
    }
    else {
      this.showEditOtherReasonTxtbx = false;
      this.editForm.get('reasonOther')?.reset('');
      this.updateEditValidation();
    }
  }

  updateValidation() {
    const reasonOther = this.form.get('reasonOther');

    if (this.showOtherReasonTxtbx) {
      reasonOther?.setValidators([Validators.required, this.noWhitespaceValidator]); // Set required validator
    } else {
      reasonOther?.clearValidators(); // Clear validators
    }

    reasonOther?.updateValueAndValidity(); // Update the validity state
  }

  updateEditValidation() {
    const reasonOther = this.editForm.get('reasonOther');

    if (this.showEditOtherReasonTxtbx) {
      reasonOther?.setValidators([Validators.required, this.noWhitespaceValidator]); // Set required validator
    } else {
      reasonOther?.clearValidators(); // Clear validators
    }

    reasonOther?.updateValueAndValidity(); // Update the validity state
  }

  numberValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return of(null); // Allow empty values if the field is optional
    }
  
    // Convert to string and trim leading zeros
    const trimmedString = value.toString().replace(/^0+/, '');
    
    // Convert back to number
    const trimmedValue = Number(trimmedString);
  
    if (isNaN(trimmedValue) || trimmedValue < 0 || !Number.isInteger(trimmedValue)) {
      return of({ notAPositiveInteger: true });
    }
  
    // Only update if the value has actually changed
    if (trimmedValue.toString() !== value.toString()) {
      setTimeout(() => {
        control.setValue(trimmedValue, { emitEvent: false });
      }, 0);
    }

    return of(null); // No errors
    
  }

  showFormModal() {
    if (!this.isFormModalOpen) {
      this.isFormModalOpen = true;
      this.resetForm();
      this.formModalInstance.show();
      this.subjects.refreshHistoryData.next();
      //this.getData();
    }
  }

  hideFormModal() {
    this.formModalInstance.hide();
    this.formModalInstance._element.addEventListener('hidden.bs.modal', () => {
      this.isFormModalOpen = false; // Reset the flag
      //this.isEditMode = false;
      this.resetForm();
    });
  }

  showEditFormModal() {
    if (!this.isEditModalOpen) {
      this.show7DaysValidationError = false;
      if(this.appService.AuthoriseAction('eobs_setmonitoring_foodandfluid')){
        this.editForm.get('recordReminderOption').enable();
        this.editForm.get('recordReminderTxtValue').enable();
        this.editForm.get('recordReminderDrpValue').enable();
        this.editForm.get('reasonValue').enable();
        this.editForm.get('reasonOther').enable();
      }
      else {
        this.editForm.get('recordReminderOption').disable();
        this.editForm.get('recordReminderTxtValue').disable();
        this.editForm.get('recordReminderDrpValue').disable();
        this.editForm.get('reasonValue').disable();
        this.editForm.get('reasonOther').disable();
      }
      this.isEditModalOpen = true;
      //this.resetForm();
      this.editModalInstance.show();
      //this.subjects.refreshHistoryData.next();
      //this.getData();
    }
  }

  hideEditFormModal() {
    this.editModalInstance.hide();
    this.editModalInstance._element.addEventListener('hidden.bs.modal', () => {
      this.isEditModalOpen = false; // Reset the flag
      //this.isEditMode = false;
      this.resetForm();
      this.getData();
      this.toggleHistory();
    });
  }

  hideFormModalOnClose(){
    this.formModalInstance.hide();
    this.formModalInstance._element.addEventListener('hidden.bs.modal', () => {
      this.isFormModalOpen = false; // Reset the flag
      //this.isEditMode = false;
      this.resetForm();
      this.subjects.closeModal.next('close modal');
    });
  }

  showSuccessModal() {
    if (!this.isSuccessModalOpen) {
      this.getData();
      this.isSuccessModalOpen = true;
      this.successModalInstance.show();
    }
  }

  hideSuccessModal() {
    this.successModalInstance.hide();
    this.successModalInstance._element.addEventListener('hidden.bs.modal', () => {
      this.isSuccessModalOpen = false; // Reset the flag
      this.subjects.closeModal.next('close modal');
    });
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

  receiveHistoryData(event:any){
    if(event){

      this.showEditSubmitButton = true;

      if(event.isLatest){
        this.showMonitoringFreq = true;
      }
      else{
        this.showMonitoringFreq = false;
      }

      this.dataToUpdate = event;

      let data:FoodFluidObservation = event;

      //this.isEditMode = true;

      //console.log(data);
      this.foodfluidobservation_id = data.foodfluidobservation_id;
      this.observationDateTime = data.datestarted;

      if(this.editFoodControls.length > 0){
        this.editFoodControls.clear();
      }
  
      if(this.editFluidControls.length > 0){
        this.editFluidControls.clear();
      }
  
      if (data.foodtaken) {
        let foodControls = JSON.parse(data.foodtaken);
        
        foodControls.forEach((foodControl: any) => {
          this.editFoodControls.push(this.fb.group({
            foodItemValue: [foodControl.foodItemValue],
            foodItemConsumedValue: [foodControl.foodItemConsumedValue]
          }));
        });
      }
  
      if (data.fluidtaken) {
        let fluidControls = JSON.parse(data.fluidtaken);

        fluidControls.forEach((fluidControl: any) => {
          const controlGroup = this.fb.group({
            fluidItemValue: [fluidControl.fluidItemValue],
            fluidItemConsumedValue: [fluidControl.fluidItemConsumedValue]
          });

          this.editFluidControls.push(controlGroup);
      
          controlGroup.get('fluidItemConsumedValue')?.setAsyncValidators(this.numberValidator.bind(this));

          this.applyValidatorsToControls(controlGroup);
        });
      }

      this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes(data.frequencyoptionselected));

      if(data.frequencyreason == 'Other'){
        this.showEditOtherReasonTxtbx = true;
      }
      else {
        this.showEditOtherReasonTxtbx = false;
      }

      if(data.reasonforedit == 'Other'){
        this.showEditReasonOtherTxtbx = true;
      }
      else {
        this.showEditReasonOtherTxtbx = false;
      }

      let frequencyEnteredExists : boolean = false;

      if(data.frequencyunitentered == 'minutes'){
        if(this.minutesDropdownValues.some(x => x.id == data.frequencyentered))
        {
          frequencyEnteredExists = true;
        }
        else 
        {
          frequencyEnteredExists = false;
        }
      }
      else if(data.frequencyunitentered == 'hours'){
        if(this.hoursDropdownValues.some(x => x.id == data.frequencyentered))
        {
          frequencyEnteredExists = true;
        }
        else 
        {
          frequencyEnteredExists = false;
        }
      }
      else if(data.frequencyunitentered == 'days'){
        if(this.daysDropdownValues.some(x => x.id == data.frequencyentered))
        {
          frequencyEnteredExists = true;
        }
        else 
        {
          frequencyEnteredExists = false;
        }
      }
      else {
        frequencyEnteredExists = false;
      }
  
      this.editForm.patchValue({
        observationDateTime: new Date(data.datestarted),
        passedUrineValue: data.passedurine,
        recordReminderOption: data.frequencyoptionselected,
        recordReminderTxtValue: data.frequencyentered == null && data.frequencyoptionselected == "StopMonitoring" ? '' : frequencyEnteredExists ? data.frequencyentered : '',
        recordReminderDrpValue: data.frequencyunitentered == null && data.frequencyoptionselected == "StopMonitoring" ? '' : data.frequencyunitentered,
        reasonValue: data.frequencyreason,
        reasonOther: data.frequencyreasonother,
        reasonForEdit: data.reasonforedit == '' ? 'EnteredInError' : data.reasonforedit,
        reasonForEditOther: data.reasonforeditother
      });

      this.createdOn = data.createdon;
      this.createdBy = data.createdby;

      this.updateEditValidation();
      this.updateOtherValidation();

      this.showEditFormModal();
    }
  }
  
  deleteFoodAndFluidRecord(foodfluidobservation_id: string){

    this.showDeleteSubmitButton = false;
    this.dataToUpdate.isedited = true;
    this.dataToUpdate.reasonfordelete = this.reasonForDelete;
    this.dataToUpdate.reasonfordeleteother = this.reasonForDeleteOther;
    this.dataToUpdate.lastmodifiedby = this.appService.loggedInUserName;
    this.dataToUpdate.lastmodifiedon = this.appService.getDateTimeinISOFormat(new Date());

    for (let key in this.dataToUpdate) {
      if (key === 'fluidtakenhtml' || key === 'foodtakenhtml' || key === '_recordstatus' || key === 'row_number' || key === 'recordingreminder' || key === 'fluidItemConsumedValue' || key === 'isLatest') {
          delete this.dataToUpdate[key];
      }
  }
    
    this.subscriptions.add(this.apiRequestService.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=foodfluidobservation", JSON.stringify(this.dataToUpdate))
      .subscribe({
        next: (response) => {
          this.apiRequestService.deleteRequest(this.appService.baseURI + "/DeleteObject?synapsenamespace=core&synapseentityname=foodfluidobservation&id=" + foodfluidobservation_id)
          .subscribe(() => {
            this.showDeleteSubmitButton = true;
            this.subjects.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.FoodAndFluid);
            this.subjects.refreshHistoryData.next();
            this.hideDeleteModal();
            //this.hideFormModal();
            //this.subjects.closeModal.next('close modal');
          });
        },
        error: (error) => {
          console.error('Error fetching config:', error);
        }
      })
    );
    //console.log(foodfluidobservation_id);
    
  }

  reasonForEditChange(event: any){
    if(event.target.value == 'EnteredInError'){
      this.showEditReasonOtherTxtbx = false;
      this.editForm.get('reasonForEditOther')?.reset('');
      this.updateOtherValidation();
    }
    else{
      this.showEditReasonOtherTxtbx = true;
      this.updateOtherValidation();
    }

  }

  updateOtherValidation() {
    const reasonForEditOther = this.editForm.get('reasonForEditOther');

    if (this.showEditReasonOtherTxtbx) {
      reasonForEditOther?.setValidators([Validators.required, this.noWhitespaceValidator]); // Set required validator
    } else {
      reasonForEditOther?.clearValidators(); // Clear validators
    }

    reasonForEditOther?.updateValueAndValidity(); // Update the validity state
  }

  reasonDeleteChange(event: any){
    if(event.target.value == 'Other'){
      this.showDeleteReasonOtherTxtbx = true;
      this.reasonForDeleteOther = '';
    }
    else {
      this.showDeleteReasonOtherTxtbx = false;
    }
  }

  showDeleteModal(event:any) {
    //this.hideFormModal();
    if (!this.isDeleteModalOpen) {
      this.hideEditFormModal();
      this.isDeleteModalOpen = true;
      this.deleteModalInstance.show();
    }
  }

  hideDeleteModal() {
    this.deleteModalInstance.hide();
    this.deleteModalInstance._element.addEventListener('hidden.bs.modal', () => {
      this.isDeleteModalOpen = false; // Reset the flag
      this.reasonForDelete = 'EnteredInError';
      this.reasonForDeleteOther = '';
    });
  }

  getData() {
    this.subscriptions.add(
      this.apiRequestService.postRequest(this.appService.baseURI + "/GetBaseViewListByPost/foodandfluid_foodandfluidobservationhistorydata", this.createFoodFluidFilter())
        .subscribe((response) => {
          this.filterdata = response;

          if(response && response.length > 0){

            let frequencyEnteredExists : boolean = false;

            const fd = response.filter(x => x._recordstatus != 2);

           if (fd[0].frequencyoptionselected == 'Time'){
              this.form.get('recordReminderOption').setValue('Time');
              if(fd[0].frequencyunitentered == ''){
                this.monitoringDropdownValues = [];
                this.monitoringDropdownValues = this.pleaseSelectDropdownValues;
                frequencyEnteredExists = false;
              }
              else if(fd[0].frequencyunitentered == 'minutes'){
                this.monitoringDropdownValues = [];
                this.monitoringDropdownValues = this.minutesDropdownValues;
                if(this.minutesDropdownValues.some(x => x.id == fd[0].frequencyentered))
                {
                  frequencyEnteredExists = true;
                }
                else 
                {
                  frequencyEnteredExists = false;
                }
              }
              else if(fd[0].frequencyunitentered == 'hours'){
                this.monitoringDropdownValues = [];
                this.monitoringDropdownValues = this.hoursDropdownValues;
                if(this.hoursDropdownValues.some(x => x.id == fd[0].frequencyentered))
                {
                  frequencyEnteredExists = true;
                }
                else 
                {
                  frequencyEnteredExists = false;
                }
              }
              else if(fd[0].frequencyunitentered == 'days'){
                this.monitoringDropdownValues = [];
                this.monitoringDropdownValues = this.daysDropdownValues;
                if(this.daysDropdownValues.some(x => x.id == fd[0].frequencyentered))
                {
                  frequencyEnteredExists = true;
                }
                else 
                {
                  frequencyEnteredExists = false;
                }
              }
             
              let frequencyentered = frequencyEnteredExists ? fd[0].frequencyentered : '';

              this.form.get('recordReminderTxtValue').setValue(frequencyentered);
              this.form.get('recordReminderDrpValue').setValue(fd[0].frequencyunitentered);

              this.monitoringFrequencyLbl = ' - every ' + fd[0].frequencyentered + ' ' + fd[0].frequencyunitentered;

              this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes('Time'));
              this.form.get('reasonValue').setValue(fd[0].frequencyreason);
              this.form.get('reasonOther').setValue(fd[0].frequencyreasonother);
              if(fd[0].frequencyreason == 'Other') {
                this.showOtherReasonTxtbx = true;
              }

              this.monitoringFrequencyReasonLbl = fd[0].frequencyreason == 'Other' ? ' - ' + fd[0].frequencyreasonother : ' - ' + fd[0].frequencyreason;
            }
            else {
              this.form.get('recordReminderTxtValue').setValue('');
              this.form.get('recordReminderDrpValue').setValue('');
              this.monitoringDropdownValues = [];
              this.monitoringDropdownValues = this.pleaseSelectDropdownValues;
              this.form.get('recordReminderOption').setValue('StopMonitoring');

              this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes('StopMonitoring'));
              this.form.get('reasonValue').setValue(fd[0].frequencyreason);
              this.form.get('reasonOther').setValue(fd[0].frequencyreasonother);
              if(fd[0].frequencyreason == 'Other') {
                this.showOtherReasonTxtbx = true;
              }
            }
          }
          else {
            this.form.get('recordReminderTxtValue').setValue('');
            this.form.get('recordReminderDrpValue').setValue('');
            this.monitoringDropdownValues = [];
            this.monitoringDropdownValues = this.pleaseSelectDropdownValues;
            this.form.get('recordReminderOption').setValue('StopMonitoring');

            this.reasonDropdownOptions = this.reasonDropdownValues.filter(x => x.for.includes('StopMonitoring'));
            this.form.get('reasonValue').setValue('Other');
            this.form.get('reasonOther').setValue('Monitoring not started');
            this.showOtherReasonTxtbx = true;
          }
        })
    );
  }

  getRunningTotalForDay() {
   
    const sevenAM = moment(this.recordDate).set({ hour: this.appService.startTime, minute: 0, second: 0, millisecond: 0 });

    const isBeforeSevenAM = moment(this.recordDate).isBefore(sevenAM);

    const startOfDay = isBeforeSevenAM 
    ? moment(this.recordDate).subtract(1, 'days').set({ hour: this.appService.startTime, minute: 0, second: 0, millisecond: 0 })
    : sevenAM; 
    

    const endOfDay = isBeforeSevenAM
    ? sevenAM
    : startOfDay.clone().add(1, 'days').set({ hour: this.appService.startTime - 1, minute: 59, second: 59, millisecond: 999 }); 

    // Filter records for the specified time range and _recordstatus = 1
    const filteredRecords = this.filterdata.filter(x => moment(x.datestarted).isSameOrAfter(startOfDay) && moment(x.datestarted).isSameOrBefore(endOfDay) && x._recordstatus == 1);

    // Calculate the running total of fluidItemConsumedValue
    let totalFluidConsumed = 0;
  
    filteredRecords.forEach(record => {
      const fluidItems = JSON.parse(record.fluidtaken); // Parse fluidtaken
      fluidItems.forEach((fluid: { fluidItemConsumedValue: string; }) => {
        totalFluidConsumed += parseFloat(fluid.fluidItemConsumedValue) || 0; // Add to total
      });
    });
  
    return totalFluidConsumed; // Return the total
  }

  toggleHistory(){
    if(!this.showHistory){
      this.showHistory = true;
    }
    else{
      this.showHistory = false;
    }
  }

  fluidBalanceStartDate(){
    const sevenAM = moment(this.recordDate).set({ hour: this.appService.startTime, minute: 0, second: 0, millisecond: 0 });
    
    const isBeforeSevenAM = moment(this.recordDate).isBefore(sevenAM);

    return isBeforeSevenAM 
    ? moment(this.recordDate).subtract(1, 'days').set({ hour: this.appService.startTime, minute: 0, second: 0, millisecond: 0 }).toDate()
    : sevenAM.toDate(); 
  }

  editSubmit() {
    this.isEditSubmitted = true;
    
    if (this.editFluidControlsHaveInvalidValue()) {
      return; 
    }

    if(!this.appService.AuthoriseAction('eobs_setmonitoring_foodandfluid')) {
      let filteredFoodItems = this.editForm.value.editFoodControls.length > 0 ? this.editForm.value.editFoodControls.filter(item => item.foodItemValue.trim() != '') : [];
      // this.foodFluidObservation.foodtaken = JSON.stringify(filteredFoodItems);

      let filteredFluidItems = this.editForm.value.editFluidControls.length > 0 ? this.editForm.value.editFluidControls.filter(item => item.fluidItemConsumedValue.trim() != '') : [];
      // this.foodFluidObservation.fluidtaken = JSON.stringify(filteredFluidItems);

      if(filteredFoodItems.length == 0 && filteredFluidItems.length == 0 && (this.editForm.getRawValue()["passedUrineValue"] == '' || this.editForm.getRawValue()["passedUrineValue"] == null || this.editForm.getRawValue()["passedUrineValue"] == 'null' || this.editForm.getRawValue()["passedUrineValue"] == undefined)) {
        this.editPassedUrineError = true;
        return;
      }
      else {
        this.editPassedUrineError = false;
      }
    }

    if(this.editForm.value.recordReminderOption == 'Time' && (this.editForm.value.recordReminderTxtValue != '' || this.editForm.value.recordReminderTxtValue != null || this.editForm.value.recordReminderTxtValue != undefined)){
      this.show7DaysValidationError = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.editForm.value.recordReminderTxtValue, this.editForm.value.recordReminderDrpValue);
      
      if(this.show7DaysValidationError){
        return;
      }
    }
    else{
      this.show7DaysValidationError = false;
    }

    if(this.editForm.valid){
      this.showEditSubmitButton = false;
      this.foodFluidObservation = new FoodFluidObservation();
      this.foodFluidObservation.foodfluidobservation_id = this.foodfluidobservation_id;

      let filteredFoodItems = this.editForm.value.editFoodControls.length > 0 ? this.editForm.value.editFoodControls.filter(item => item.foodItemValue.trim() != '') : [];
      this.foodFluidObservation.foodtaken = JSON.stringify(filteredFoodItems);

      let filteredFluidItems = this.editForm.value.editFluidControls.length > 0 ? this.editForm.value.editFluidControls.filter(item => item.fluidItemConsumedValue.trim() != '') : [];
      this.foodFluidObservation.fluidtaken = JSON.stringify(filteredFluidItems);

      this.foodFluidObservation.datestarted = this.getDateTimefromForm(this.editForm.getRawValue()["observationDateTime"]);
      this.foodFluidObservation.datefinished = this.getDateTimefromForm(this.editForm.getRawValue()["observationDateTime"]);
      this.foodFluidObservation.passedurine = this.editForm.value.passedUrineValue;
      this.foodFluidObservation.frequencyunitentered = this.editForm.getRawValue()["recordReminderOption"] == 'Time' ? this.editForm.getRawValue()["recordReminderDrpValue"] : null;
      this.foodFluidObservation.frequencyentered = this.editForm.getRawValue()["recordReminderOption"] == 'Time' ? this.editForm.getRawValue()["recordReminderTxtValue"] : null;
      this.foodFluidObservation.frequencyreason = this.editForm.getRawValue()["reasonValue"];
      this.foodFluidObservation.frequencyreasonother = this.editForm.getRawValue()["reasonOther"];
      this.foodFluidObservation.frequencyoptionselected = this.editForm.getRawValue()["recordReminderOption"];
      this.foodFluidObservation.person_id = this.appService.personId;
      this.foodFluidObservation.encounter_id = this.appService.encounter.encounter_id;
      this.foodFluidObservation.createdon = this.createdOn;
      this.foodFluidObservation.lastmodifiedon = this.appService.getDateTimeinISOFormat(new Date());
      this.foodFluidObservation.createdby = this.createdBy;
      this.foodFluidObservation.lastmodifiedby = this.appService.loggedInUserName;
      this.foodFluidObservation.isedited = true;
  
      if(this.editForm.getRawValue()["recordReminderOption"] == 'Time' && this.editForm.getRawValue()["recordReminderDrpValue"] == 'hours'){
        this.foodFluidObservation.observationfrequency = this.editForm.getRawValue()["recordReminderTxtValue"];
      }
      else if(this.editForm.getRawValue()["recordReminderOption"] == 'Time' && this.editForm.getRawValue()["recordReminderDrpValue"] == 'minutes'){
        this.foodFluidObservation.observationfrequency = (this.editForm.getRawValue()["recordReminderTxtValue"] / 60).toString();
      }
      else if(this.editForm.getRawValue()["recordReminderOption"] == 'Time' && this.editForm.getRawValue()["recordReminderDrpValue"] == 'days'){
        this.foodFluidObservation.observationfrequency = (this.editForm.getRawValue()["recordReminderTxtValue"] * 24).toString();
      }
      else {
        this.foodFluidObservation.observationfrequency = null;
      }
  
      this.foodFluidObservation.reasonforedit = this.editForm.value.reasonForEdit;
      this.foodFluidObservation.reasonforeditother = this.editForm.value.reasonForEdit == 'Other' ? this.editForm.value.reasonForEditOther : '';
      
      this.foodFluidObservation.monitoringnotrequired = this.editForm.getRawValue()["recordReminderOption"] == 'Time' ? false : true;
  
      this.recordDate = this.foodFluidObservation.datestarted;
  
      this.subscriptions.add(this.apiRequestService.postRequest(this.appService.baseURI + "/PostObject?synapsenamespace=core&synapseentityname=foodfluidobservation", JSON.stringify(this.foodFluidObservation))
        .subscribe({
          next: (response) => {
            this.showEditSubmitButton = true;
            this.isEditSubmitted = false;
            this.show7DaysValidationError = false;
            this.subjects.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.FoodAndFluid);
            this.subjects.refreshHistoryData.next();
            this.hideEditFormModal();
          },
          error: (error) => {
            console.error('Error fetching config:', error);
          }
        })
      );
    }
    
  }
 
  resetValidation(event: any, formType: string){
    this.show7DaysValidationError = false;
    if(event.target.value == ''){
      this.monitoringDropdownValues = [];
      this.monitoringDropdownValues = this.pleaseSelectDropdownValues;
      if(formType == 'form'){
        this.form.get('recordReminderTxtValue').setValue('');
      }
      if(formType == 'editForm'){
        this.editForm.get('recordReminderTxtValue').setValue('');
      }
    }
    else if(event.target.value == 'minutes'){
      this.monitoringDropdownValues = [];
      this.monitoringDropdownValues = this.minutesDropdownValues;
      if(formType == 'form'){
        this.form.get('recordReminderTxtValue').setValue('');
      }
      if(formType == 'editForm'){
        this.editForm.get('recordReminderTxtValue').setValue('');
      }
    }
    else if(event.target.value == 'hours'){
      this.monitoringDropdownValues = [];
      this.monitoringDropdownValues = this.hoursDropdownValues;
      if(formType == 'form'){
        this.form.get('recordReminderTxtValue').setValue('');
      }
      if(formType == 'editForm'){
        this.editForm.get('recordReminderTxtValue').setValue('');
      }
    }
    else if(event.target.value == 'days'){
      this.monitoringDropdownValues = [];
      this.monitoringDropdownValues = this.daysDropdownValues;
      if(formType == 'form'){
        this.form.get('recordReminderTxtValue').setValue('');
      }
      if(formType == 'editForm'){
        this.editForm.get('recordReminderTxtValue').setValue('');
      }
    }
  }

  fluidControlsHaveInvalidConsumedValue(): boolean {
    return this.fluidControls.controls.some(control => 
      control.get('fluidItemConsumedValue')?.invalid
    );
  }

  fluidControlsHaveInvalidValue(): boolean {
    return this.fluidControls.controls.some(control => 
      control.get('fluidItemValue')?.invalid
    );
  }

  editFluidControlsHaveInvalidConsumedValue(): boolean {
    return this.editFluidControls.controls.some(control => 
      control.get('fluidItemConsumedValue')?.invalid
    );
  }

  editFluidControlsHaveInvalidValue(): boolean {
    return this.editFluidControls.controls.some(control =>  
      control.get('fluidItemValue')?.invalid
    );
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  private setReminderValidators(value: string): void {
    const recordReminderTxt = this.form.get('recordReminderTxtValue');
    const recordReminderDrp = this.form.get('recordReminderDrpValue');

    if (value === 'Time') {
      // Add required validators if 'Time' is selected
      recordReminderTxt?.setValidators([Validators.required]);
      recordReminderDrp?.setValidators([Validators.required]);
    } else {
      // Remove required validators if 'Time' is not selected
      recordReminderTxt?.clearValidators();
      recordReminderDrp?.clearValidators();
    }

    // Update the form control validation status
    recordReminderTxt?.updateValueAndValidity();
    recordReminderDrp?.updateValueAndValidity();
  }

  private setEditReminderValidators(value: string): void {
    const recordReminderTxt = this.editForm.get('recordReminderTxtValue');
    const recordReminderDrp = this.editForm.get('recordReminderDrpValue');

    if (value === 'Time') {
      // Add required validators if 'Time' is selected
      recordReminderTxt?.setValidators([Validators.required]);
      recordReminderDrp?.setValidators([Validators.required]);
    } else {
      // Remove required validators if 'Time' is not selected
      recordReminderTxt?.clearValidators();
      recordReminderDrp?.clearValidators();
    }

    // Update the form control validation status
    recordReminderTxt?.updateValueAndValidity();
    recordReminderDrp?.updateValueAndValidity();
  }

  applyValidatorsToControls(controlGroup: FormGroup): void {
    const fluidItemValueControl = controlGroup.get('fluidItemValue');
    const fluidItemConsumedValueControl = controlGroup.get('fluidItemConsumedValue');
  
    if (fluidItemValueControl?.value) {
      fluidItemConsumedValueControl?.setValidators([Validators.required]);
    } else {
      fluidItemConsumedValueControl?.clearValidators();
    }
  
    if (fluidItemConsumedValueControl?.value) {
      fluidItemValueControl?.setValidators([Validators.required, this.noWhitespaceValidator]);
    } else {
      fluidItemValueControl?.clearValidators();
    }
  
    fluidItemValueControl?.updateValueAndValidity();
    fluidItemConsumedValueControl?.updateValueAndValidity();
  }

}
