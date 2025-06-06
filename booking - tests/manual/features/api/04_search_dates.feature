@API @Regression
# Priority: High
Feature: Hotel search with check-in/check-out

  Scenario Outline: Search hotels in "<city>" with date filters
    When I send GET request to /api/hotels?city=<city>&checkin=<checkin>&checkout=<checkout>
    Then response should contain available hotels in "<city>"

    Examples:
      | city      | checkin     | checkout    |
      | Paris     | 2025-07-01  | 2025-07-05  |
      | Rome      | 2025-08-10  | 2025-08-15  |
