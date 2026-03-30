
import React, { useState } from 'react';
import type { TrainingCourse, UserTrainingProgress, Lesson, StoryScenario } from '../types';
import { trainingCourses } from '../data/trainingData';
import { storyScenarios } from '../data/storyData';
import { CourseDetailPage } from './CourseDetailPage';
import { LessonPlayer } from './LessonPlayer';
import { InteractiveStoryPlayer } from './InteractiveStoryPlayer';
import { SparklesIcon, GraduationCapIcon } from './Icons';

interface TrainingPageProps {
  userProgress: UserTrainingProgress;
  onUpdateProgress: (courseId: string, lessonId: string, score?: number) => void;
}

const CourseCard: React.FC<{ course: TrainingCourse; progress?: UserTrainingProgress[string] }> = ({ course, progress }) => {
    const totalLessons = course.lessons.length;
    const completedLessons = progress?.completedLessons.length || 0;
    const completion = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full transition-transform hover:scale-105">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{course.title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">{course.description}</p>
            <div className="mt-4">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>Progress ({completedLessons}/{totalLessons})</span>
                    <span>{completion.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${completion}%` }}></div>
                </div>
            </div>
            {progress?.badgeEarned && (
                 <div className="mt-4 text-center py-1 px-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold rounded-full">
                    Badge Earned!
                </div>
            )}
        </div>
    );
};

const ScenarioCard: React.FC<{ scenario: StoryScenario }> = ({ scenario }) => {
    return (
        <div className="group bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full transition-all hover:shadow-xl hover:border-purple-500/50">
            <div className="h-40 w-full overflow-hidden relative">
                <img src={scenario.coverImage} alt={scenario.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                    {scenario.difficulty}
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Interactive Scenario</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{scenario.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">{scenario.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-teal-600 dark:text-teal-400 group-hover:underline">Start Simulation &rarr;</span>
                </div>
            </div>
        </div>
    );
};

export const TrainingPage: React.FC<TrainingPageProps> = ({ userProgress, onUpdateProgress }) => {
    const [activeTab, setActiveTab] = useState<'courses' | 'scenarios'>('courses');
    const [activeCourse, setActiveCourse] = useState<TrainingCourse | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [activeScenario, setActiveScenario] = useState<StoryScenario | null>(null);

    const handleSelectCourse = (course: TrainingCourse) => {
        setActiveCourse(course);
    };

    const handleStartLesson = (lesson: Lesson) => {
        setActiveLesson(lesson);
    };

    const handleCompleteLesson = (courseId: string, lessonId: string, score?: number) => {
        onUpdateProgress(courseId, lessonId, score);
        setActiveLesson(null); // Close the lesson player
    };

    if (activeScenario) {
        return (
            <InteractiveStoryPlayer 
                scenario={activeScenario}
                onClose={() => setActiveScenario(null)}
            />
        );
    }

    if (activeCourse) {
        return (
            <>
                <CourseDetailPage
                    course={activeCourse}
                    userProgress={userProgress[activeCourse.id]}
                    onBack={() => setActiveCourse(null)}
                    onStartLesson={handleStartLesson}
                />
                {activeLesson && (
                    <LessonPlayer
                        course={activeCourse}
                        lesson={activeLesson}
                        onClose={() => setActiveLesson(null)}
                        onCompleteLesson={handleCompleteLesson}
                    />
                )}
            </>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Training & Awareness</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Enhance your cybersecurity knowledge with courses and interactive simulations.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'courses' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
                    >
                        <GraduationCapIcon className="w-5 h-5" />
                        Standard Courses
                    </button>
                    <button
                        onClick={() => setActiveTab('scenarios')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'scenarios' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Interactive Stories
                    </button>
                </nav>
            </div>

            {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {trainingCourses.map(course => (
                        <button key={course.id} onClick={() => handleSelectCourse(course)} className="text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg">
                            <CourseCard course={course} progress={userProgress[course.id]} />
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'scenarios' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {storyScenarios.map(scenario => (
                        <button key={scenario.id} onClick={() => setActiveScenario(scenario)} className="text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg">
                            <ScenarioCard scenario={scenario} />
                        </button>
                    ))}
                </div>
            )}
            
        </div>
    );
};
