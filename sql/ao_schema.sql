
/*** for oracle 12*/


/** 

drop table PQ_AO;
drop table REF_CONCELHO_AO;

*/


create table PQ_AO (
    AO          varchar2(80) not null,
    P           number not null,
    Q           number not null,
    TIME_DATA   timestamp,
    TIME_CALC   timestamp
);


create table REF_CONCELHO_AO (
    CODIGO_NUMER    varchar2(10),
    CONCELHO        varchar2(80),
    ABREVIATURA     varchar2(10),
    DISTRITO        varchar2(80),
    AO              varchar2(80),
    DRC             varchar2(80),
    COLOUR          varchar2(10),
    CODIGO          varchar2(10),
    DRC_AO_SIGLA    varchar2(20),
    AO_SIGLA        varchar2(10),
    DRC_SIGLA       varchar2(10),
    COLOUR_DRC      varchar2(10),
    COLOUR_AO       varchar2(10)
);

CREATE UNIQUE INDEX UNQ_REF_CONCELHO_AO ON REF_CONCELHO_AO (CODIGO_NUMER);
