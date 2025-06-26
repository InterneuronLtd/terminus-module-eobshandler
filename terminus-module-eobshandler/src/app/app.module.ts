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
import { BrowserModule } from '@angular/platform-browser';
import { DoBootstrap, NgModule } from '@angular/core';
import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app.component';
import { MonitoringFrequencyComponent } from './monitoring-frequency/monitoring-frequency.component';
import { HistoryViewerComponent } from './history-viewer/history-viewer.component';
import { BloodGlucoseComponent } from './blood-glucose/blood-glucose.component';
import { GCSNeurologiComponent } from './gcs-neurologi/gcs-neurologi.component';
import { BloodPressureComponent } from './blood-pressure/blood-pressure.component';
import { ChartComponent } from './chart/chart.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { ObservationMonitoringFrequencyComponent } from './observation-monitoring-frequency/observation-monitoring-frequency.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BristolStoolChartComponent } from './bristol-stool-chart/bristol-stool-chart.component';
import { FoodAndFluidComponent } from './food-and-fluid/food-and-fluid.component';
import { HeightWeightWaistComponent } from './height-weight-waist/height-weight-waist.component';
import { FoodAndFluidHistoryViewerComponent } from './food-and-fluid-history-viewer/food-and-fluid-history-viewer.component';

@NgModule({ declarations: [
        AppComponent,
        ObservationMonitoringFrequencyComponent,
        ChartComponent,
        BloodPressureComponent,
        GCSNeurologiComponent,
        BloodGlucoseComponent,
        HistoryViewerComponent,
        MonitoringFrequencyComponent,
        BristolStoolChartComponent,
        FoodAndFluidComponent,
        HeightWeightWaistComponent,
        FoodAndFluidHistoryViewerComponent
    ],
    bootstrap: [],
     imports: [BrowserModule,FormsModule,
      BsDatepickerModule.forRoot(),
      TimepickerModule.forRoot(),
      ReactiveFormsModule,
      BrowserAnimationsModule
     ],
      providers: [BsModalRef,BsModalService,BsDatepickerConfig,provideHttpClient(withInterceptorsFromDi())] })
export class AppModule implements DoBootstrap { 
  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {
    const el = createCustomElement(AppComponent, { injector: this.injector });
    customElements.define('app-eobshandler', el);
  }
}
