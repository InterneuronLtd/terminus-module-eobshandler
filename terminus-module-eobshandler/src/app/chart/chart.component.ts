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
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Graph2d, Graph2dOptions } from 'vis-timeline/standalone';
import * as moment from 'moment';
import { BsModalService } from 'ngx-bootstrap/modal';


@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {

  private graph2d: any;
  listofRecords: any;
  chartHeading: string;
  
  @ViewChild('visualization') visualization!: ElementRef;

  @Input() chartData = [];

  @Input() chartConfig;

  constructor(public modalService:BsModalService) {
  }

  ngOnInit(): void {
    this.chartHeading = this.chartConfig.chartHeading;
  }

  ngAfterViewInit() {
    this.loadChart();
  }

  loadChart() {
    const items = [];
    this.chartData.forEach(element => {
      if(+(element.value)) {
        items.push({ x: moment(element.datestarted).toDate(), y: element.value ,label: {content:element.value}})
      }
      
    });

    // Configuration for the Graph2d
    const options: Graph2dOptions = {
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: this.chartConfig.UOM
          }
        }
      },
      start: moment().subtract(5, 'days').toDate(),
      end: moment().add(5, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },
      // timeAxis: {
      //   scale: 'day',
      //   step: 1,
      //   title: {
      //     text: 'X-axis Label'
      //   }
      // }
      // shaded: {
      //   orientation: 'bottom' // top, bottom
      // }
    };

    // Create a Graph2d
    this.graph2d = new Graph2d(this.visualization.nativeElement, items, options);
    
  }

  zoomIn(): void {
    const range = this.graph2d.getWindow();
    const interval = range.end - range.start;
    this.graph2d.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
  }

  zoomOut(): void {
    const range = this.graph2d.getWindow();
    const interval = range.end - range.start;
    this.graph2d.setWindow({
      start: moment(range.start).subtract(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).add(interval * 0.2, 'milliseconds').toDate()
    });
  }

  closeGraphModal() {
    // this.subject.closeGraphModal.next(true);  
    this.modalService.hide();
  }
}
