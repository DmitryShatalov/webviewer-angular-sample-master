import { Component, ViewChild, OnInit, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import WebViewer, { WebViewerInstance } from '@pdftron/webviewer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer') viewer: ElementRef;
  wvInstance: WebViewerInstance;
  @Output() coreControlsEvent:EventEmitter<string> = new EventEmitter(); 

  private documentLoaded$: Subject<void>;

  constructor() {
    this.documentLoaded$ = new Subject<void>();
  }

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      initialDoc: '../files/webviewer-demo-annotated.pdf'
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;

      this.coreControlsEvent.emit(instance.UI.LayoutMode.Single);

      const { documentViewer, Annotations, annotationManager } = instance.Core;

      class TriangleAnnotation extends Annotations.CustomAnnotation {
        constructor() {
          super('triangle'); // provide the custom XFDF element name
          this.Subject = 'Triangle';
        }

        draw(ctx, pageMatrix) {
          // the setStyles function is a function on markup annotations that sets up
          // certain properties for us on the canvas for the annotation's stroke thickness.
          this.setStyles(ctx, pageMatrix);
      
          // first we need to translate to the annotation's x/y coordinates so that it's
          // drawn in the correct location
          ctx.translate(this.X, this.Y);
          ctx.beginPath();
          ctx.moveTo(this.Width / 2, 0);
          ctx.lineTo(this.Width, this.Height);
          ctx.lineTo(0, this.Height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    
      // this is necessary to set the elementName before instantiation
      TriangleAnnotation.prototype.elementName = 'triangle';
      annotationManager.registerAnnotationType(TriangleAnnotation.prototype.elementName, TriangleAnnotation);

      instance.UI.openElements(['notesPanel']);

      documentViewer.addEventListener('annotationsLoaded', () => {
        console.log('annotations loaded');
      });

      documentViewer.addEventListener('documentLoaded', () => {
        this.documentLoaded$.next();
        const rectangleAnnot = new Annotations.RectangleAnnotation({
          PageNumber: 1,
          // values are in page coordinates with (0, 0) in the top left
          X: 100,
          Y: 150,
          Width: 200,
          Height: 50,
          Author: annotationManager.getCurrentUser()
        });
        annotationManager.addAnnotation(rectangleAnnot);
        annotationManager.redrawAnnotation(rectangleAnnot);
      });
    })
  }

  ngOnInit() {
  }

  getDocumentLoadedObservable() {
    return this.documentLoaded$.asObservable();
  }
}
