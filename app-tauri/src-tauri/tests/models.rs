use crate::models::*;
use serde_json;
use std::path::PathBuf;

#[test]
fn test_user_profile_serialization() {
    let profile = UserProfile {
        id: 1,
        name: "Test User".to_string(),
        email: Some("test@example.com".to_string()),
        phone: Some("+33612345678".to_string()),
        locations: UserLocations {
            primary: "Paris".to_string(),
            secondary: Some("Lyon".to_string()),
            coordinates: Some(LocationCoordinates {
                primary: Coordinates { lat: 48.8566, lng: 2.3522 },
                secondary: Some(Coordinates { lat: 45.7640, lng: 4.8357 }),
            }),
        },
        cv: CVInfo {
            path: std::path::PathBuf::from("cv.pdf"),
            last_updated: "2024-03-21".to_string(),
            skills: Some(vec!["Rust".to_string(), "Python".to_string()]),
            experience_years: Some(5),
            education: Some(vec![Education {
                institution: "University".to_string(),
                degree: "Master".to_string(),
                field: "Computer Science".to_string(),
                start_year: 2015,
                end_year: Some(2017),
            }]),
            certifications: Some(vec!["Certification 1".to_string()]),
        },
        preferences: Some(UserPreferences {
            notifications: Some(true),
            dark_mode: Some(true),
            language: Some("fr".to_string()),
            commute_mode: Some("public_transport".to_string()),
        }),
        job_preferences: Some(JobPreferences {
            min_salary: Some(50000.0),
            preferred_job_types: Some(vec!["Full-time".to_string()]),
            remote_preference: Some("hybrid".to_string()),
        }),
    };

    let serialized = serde_json::to_string(&profile).unwrap();
    let deserialized: UserProfile = serde_json::from_str(&serialized).unwrap();
    
    assert_eq!(profile.id, deserialized.id);
    assert_eq!(profile.name, deserialized.name);
    assert_eq!(profile.email, deserialized.email);
    assert_eq!(profile.phone, deserialized.phone);
}

#[test]
fn test_job_serialization() {
    let job = Job {
        id: 1,
        title: "Software Engineer".to_string(),
        company: "Tech Corp".to_string(),
        location: "Paris".to_string(),
        description: "Looking for a skilled software engineer".to_string(),
        url: "https://example.com/job/1".to_string(),
        source: "LinkedIn".to_string(),
        published_at: "2024-03-21".to_string(),
        salary: Some(SalaryRange {
            min: Some(50000.0),
            max: Some(70000.0),
            currency: Some("EUR".to_string()),
            period: Some("year".to_string()),
        }),
        matching_score: 0.85,
        commute_times: CommuteTimes {
            primary_home: CommuteLocation {
                duration: 30,
                distance: 5.0,
                mode: "public_transport".to_string(),
                coordinates: Some(Coordinates { lat: 48.8566, lng: 2.3522 }),
            },
            secondary_home: Some(CommuteLocation {
                duration: 45,
                distance: 8.0,
                mode: "car".to_string(),
                coordinates: Some(Coordinates { lat: 45.7640, lng: 4.8357 }),
            }),
        },
        skills: Some(vec!["Rust".to_string(), "Python".to_string()]),
        experience_level: Some("Senior".to_string()),
        applied_at: Some("2024-03-22".to_string()),
        status: Some("Applied".to_string()),
    };

    let serialized = serde_json::to_string(&job).unwrap();
    let deserialized: Job = serde_json::from_str(&serialized).unwrap();
    
    assert_eq!(job.id, deserialized.id);
    assert_eq!(job.title, deserialized.title);
    assert_eq!(job.company, deserialized.company);
    assert_eq!(job.matching_score, deserialized.matching_score);
} 