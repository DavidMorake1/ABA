// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component } from '@angular/core';
import { IonicPage, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { CoreDomUtilsProvider } from '../../../../providers/utils/dom';
import { CoreTextUtilsProvider } from '../../../../providers/utils/text';
import { CoreCourseProvider } from '../../providers/course';
import { CoreCourseHelperProvider } from '../../providers/helper';
import { CoreCourseFormatDelegate } from '../../providers/format-delegate';
import { CoreCoursesDelegate } from '../../../courses/providers/delegate';

/**
 * Page that displays the list of courses the user is enrolled in.
 */
@IonicPage({segment: 'core-course-section'})
@Component({
    selector: 'page-core-course-section',
    templateUrl: 'section.html',
})
export class CoreCourseSectionPage {
    title: string;
    course: any;
    sections: any[];
    courseHandlers: any[];
    dataLoaded: boolean;

    constructor(navParams: NavParams, private courseProvider: CoreCourseProvider, private domUtils: CoreDomUtilsProvider,
            private courseFormatDelegate: CoreCourseFormatDelegate, private coursesDelegate: CoreCoursesDelegate,
            private translate: TranslateService, private courseHelper: CoreCourseHelperProvider,
            private textUtils: CoreTextUtilsProvider) {
        this.course = navParams.get('course');
        this.title = courseFormatDelegate.getCourseTitle(this.course);
    }

    /**
     * View loaded.
     */
    ionViewDidLoad() {
        this.loadData().finally(() => {
            this.dataLoaded = true;
        });
    }

    /**
     * Fetch and load all the data required for the view.
     */
    protected loadData(refresh?: boolean) {
        let promises = [],
            promise;

        // Get the completion status.
        if (this.course.enablecompletion === false) {
            // Completion not enabled.
            promise = Promise.resolve({});
        } else {
            promise = this.courseProvider.getActivitiesCompletionStatus(this.course.id).catch(() => {
                // It failed, don't use completion.
                return {};
            });
        }

        promises.push(promise.then((completionStatus) => {
            // Get all the sections.
            promises.push(this.courseProvider.getSections(this.course.id, false, true).then((sections) => {
                // Format the name of each section and check if it has content.
                this.sections = sections.map((section) => {
                    this.textUtils.formatText(section.name.trim(), true, true).then((name) => {
                        section.formattedName = name;
                    });
                    section.hasContent = this.courseHelper.sectionHasContent(section);
                    return section;
                });


                if (this.courseFormatDelegate.canViewAllSections(this.course)) {
                    // Add a fake first section (all sections).
                    this.sections.unshift({
                        name: this.translate.instant('core.course.allsections'),
                        id: CoreCourseProvider.ALL_SECTIONS_ID
                    });
                }
            }));
        }));

        // Load the course handlers.
        promises.push(this.coursesDelegate.getHandlersToDisplay(this.course, refresh, false).then((handlers) => {
            this.courseHandlers = handlers;
        }));

        return Promise.all(promises).catch((error) => {
            this.domUtils.showErrorModalDefault(error, 'mm.course.couldnotloadsectioncontent', true);
        });
    }

    /**
     * Refresh the data.
     *
     * @param {any} refresher Refresher.
     */
    doRefresh(refresher: any) {
        let promises = [];

        promises.push(this.courseProvider.invalidateSections(this.course.id));

        // if ($scope.sections) {
        //     promises.push($mmCoursePrefetchDelegate.invalidateCourseUpdates(courseId));
        // }

        Promise.all(promises).finally(() => {
            this.loadData(true).finally(() => {
                refresher.complete();
            });
        });
    }
}
